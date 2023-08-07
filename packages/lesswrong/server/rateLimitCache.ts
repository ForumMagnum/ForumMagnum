import moment from "moment";
import { appendToSunshineNotes } from "../lib/collections/users/helpers";
import { forumSelect } from "../lib/forumTypeUtils";
import { loadByIds } from "../lib/loaders";
import { autoCommentRateLimits, autoPostRateLimits } from "../lib/rateLimits/constants";
import type { AutoRateLimit, CommentAutoRateLimit, PostAutoRateLimit, RateLimitInfo, RecentKarmaInfo, RecentVoteInfo, UserKarmaInfo } from "../lib/rateLimits/types";
import { calculateRecentKarmaInfo, getActiveRateLimits, shouldRateLimitApply } from "../lib/rateLimits/utils";
import Users from "../lib/vulcan-users";
import { triggerReview } from "./callbacks/sunshineCallbackUtils";
import { getRecentKarmaInfo, rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost } from "./rateLimitUtils";
import VotesRepo from "./repos/VotesRepo";

interface UserAutoRateLimitCacheRecord {
  activePostRateLimitInfo: RateLimitInfo | null,
  activeCommentRateLimitInfo: RateLimitInfo | null,
  cachedAt: number
}

/**
 * We have a situation with auto-rate-limits where we want to see when users have stricter rate limits applied to them.
 * Those depend on the votes the user received on their last 20 posts & last 20 comments.
 * Trying to do a "lookback" is pretty annoying, since users can have older stuff voted on.
 * 
 * So we just cache the derived rate limit states during the `createBefore` callback for votes,
 * and then compare those to the derived rate limit states during the `castVoteAsync` callback.
 * 
 * This works with a local cache because callbacks will get run by the same server for any individual vote.
 */
const USER_AUTO_RATE_LIMIT_CACHE: Record<string, UserAutoRateLimitCacheRecord> = {};

function isNewRateLimitStricter(newRateLimit: RateLimitInfo | null, oldRateLimit: RateLimitInfo | null) {
  if (!newRateLimit) return false;
  if (!oldRateLimit) return true;

  return newRateLimit.nextEligible.getTime() > oldRateLimit.nextEligible.getTime();
}

function clearStaleCachedRateLimits() {
  const now = Date.now();
  Object.entries(USER_AUTO_RATE_LIMIT_CACHE).forEach(([userId, cacheEntry]) => {
    if (moment(now).subtract(5, 'minutes').isAfter(moment(cacheEntry.cachedAt))) {
      delete USER_AUTO_RATE_LIMIT_CACHE[userId];
    }
  });
}

function triggerReviewForNewRateLimit(userId: string, message: string, context: ResolverContext) {
  void triggerReview(userId);
  void appendToSunshineNotes({
    moderatedUserId: userId,
    adminName: 'Automod',
    text: message,
    context,
  });
}

/**
 * Used by the `createBefore` vote callback
 */
export async function cacheRateLimitInfoForUsers(userIds: string[], postId: string | null, context: ResolverContext) {
  const votedOnUsers = (await loadByIds(context, 'Users', userIds)).filter((user): user is DbUser => !!user);

  await Promise.all(votedOnUsers.map(async (user) => {
    const [activePostRateLimitInfo, activeCommentRateLimitInfo] = await Promise.all([
      rateLimitDateWhenUserNextAbleToPost(user),
      rateLimitDateWhenUserNextAbleToComment(user, postId, context)
    ]);

    USER_AUTO_RATE_LIMIT_CACHE[user._id] = {
      activePostRateLimitInfo,
      activeCommentRateLimitInfo,
      cachedAt: Date.now()
    };
  }));
}

/**
 * Used by the `castVoteAsync` vote callback
 */
export async function compareCachedRateLimitsForReview(userIds: string[], postId: string | null, context: ResolverContext) {
  const now = Date.now();

  clearStaleCachedRateLimits();
  const votedOnUsers = (await loadByIds(context, 'Users', userIds)).filter((user): user is DbUser => !!user);

  await Promise.all(votedOnUsers.map(async (user) => {
    const [activePostRateLimitInfo, activeCommentRateLimitInfo] = await Promise.all([
      rateLimitDateWhenUserNextAbleToPost(user),
      rateLimitDateWhenUserNextAbleToComment(user, postId, context)
    ]);

    const cachedRateLimitInfo = USER_AUTO_RATE_LIMIT_CACHE[user._id];
    // This is technically not atomic/safe, since it risks deleting a new record that was inserted after fetching it on the line above
    // But in practice that's not going to happen, and the only downside is extraneously adding a user to the review queue
    delete USER_AUTO_RATE_LIMIT_CACHE[user._id];

    if (!activePostRateLimitInfo && !activeCommentRateLimitInfo) {
      return;
    }

    const {
      cachedAt,
      activePostRateLimitInfo: cachedPostRateLimitInfo,
      activeCommentRateLimitInfo: cachedCommentRateLimitInfo
    } = cachedRateLimitInfo;

    if (cachedAt > now) {
      return;
    }

    if (isNewRateLimitStricter(activePostRateLimitInfo, cachedPostRateLimitInfo)) {
      triggerReviewForNewRateLimit(user._id, 'User triggered a stricter post rate limit', context);
    }

    if (isNewRateLimitStricter(activeCommentRateLimitInfo, cachedCommentRateLimitInfo)) {
      triggerReviewForNewRateLimit(user._id, 'User triggered a stricter comment rate limit', context);
    }
  }));
}

function sortRateLimitsByTimeframe<T extends AutoRateLimit>(rateLimits: T[]) {
  const now = Date.now();

  return [...rateLimits].sort((a, b) => (
    moment(now)
      .add(b.timeframeLength / b.itemsPerTimeframe, b.timeframeUnit)
      .diff(
        moment(now).add(a.timeframeLength / a.itemsPerTimeframe, a.timeframeUnit)
      )
  ));
}

type RateLimitComparison<T extends AutoRateLimit> = {
  isStricter: true;
  strictestNewRateLimit: T;
} | {
  isStricter: false;
  strictestNewRateLimit?: undefined;
};

function areNewRateLimitsStricter<T extends AutoRateLimit>(newRateLimits: T[], oldRateLimits: T[]): RateLimitComparison<T> {
  if (newRateLimits.length === 0) {
    return { isStricter: false };
  }

  const now = Date.now();

  // Cast because we check that it's non-zero length above
  const strictestNewRateLimit = sortRateLimitsByTimeframe(newRateLimits).shift() as T;
  const strictestOldRateLimit = sortRateLimitsByTimeframe(oldRateLimits).shift();

  if (!strictestOldRateLimit) {
    return { isStricter: true, strictestNewRateLimit };
  }

  const { timeframeLength: newLength, timeframeUnit: newUnit, itemsPerTimeframe: newItemsPerTimeframe } = strictestNewRateLimit;
  const { timeframeLength: oldLength, timeframeUnit: oldUnit, itemsPerTimeframe: oldItemsPerTimeframe } = strictestOldRateLimit;

  const newRateLimitMoment = moment(now).add(newLength / newItemsPerTimeframe, newUnit);
  const oldRateLimitMoment = moment(now).add(oldLength / oldItemsPerTimeframe, oldUnit);

  const isStricter = newRateLimitMoment.isAfter(oldRateLimitMoment);
  if (isStricter) {
    return { isStricter, strictestNewRateLimit };
  } else {
    return { isStricter };
  }
}

function triggerReviewForStricterRateLimits(
  userId: string,
  commentRateLimitComparison: RateLimitComparison<CommentAutoRateLimit>,
  postRateLimitComparison: RateLimitComparison<PostAutoRateLimit>,
  context: ResolverContext
) {
  if (!commentRateLimitComparison.isStricter && !postRateLimitComparison.isStricter) {
    return;
  }

  if (commentRateLimitComparison.isStricter) {
    const { strictestNewRateLimit: { itemsPerTimeframe, timeframeUnit, timeframeLength } } = commentRateLimitComparison;

    void triggerReview(userId);
    void appendToSunshineNotes({
      moderatedUserId: userId,
      adminName: 'Automod',
      text: `User triggered a stricter ${itemsPerTimeframe} comment(s) per ${timeframeLength} ${timeframeUnit} rate limit`,
      context,
    });
  }

  if (postRateLimitComparison.isStricter) {
    const { strictestNewRateLimit: { itemsPerTimeframe, timeframeUnit, timeframeLength } } = postRateLimitComparison;

    void triggerReview(userId);
    void appendToSunshineNotes({
      moderatedUserId: userId,
      adminName: 'Automod',
      text: `User triggered a stricter ${itemsPerTimeframe} post(s) per ${timeframeLength} ${timeframeUnit} rate limit`,
      context,
    });
  }
}

function documentOnlyHasSelfVote(userId: string, mostRecentVoteInfo: RecentVoteInfo, allVoteInfo: RecentVoteInfo[]) {
  return (
    mostRecentVoteInfo.userId === userId &&
    allVoteInfo.filter(v => v.userId === userId && v.documentId === mostRecentVoteInfo.documentId).length === 1
  );
}

interface UserKarmaInfoWindow {
  currentUserKarmaInfo: DbUser & { recentKarmaInfo: RecentKarmaInfo };
  previousUserKarmaInfo: DbUser & { recentKarmaInfo: RecentKarmaInfo };
}

function getCurrentAndPreviousUserKarmaInfo(user: DbUser, currentVotes: RecentVoteInfo[], previousVotes: RecentVoteInfo[]): UserKarmaInfoWindow {
  const currentKarmaInfo = calculateRecentKarmaInfo(user._id, currentVotes);
  const previousKarmaInfo = calculateRecentKarmaInfo(user._id, previousVotes);

  // Adjust the user's karma back to what it was before the most recent vote
  // This doesn't always handle the case where the voter is modifying an existing vote's strength correctly, but we don't really care about those
  const mostRecentVotePower = currentVotes[0].power;
  const previousUserKarma = user.karma - mostRecentVotePower;

  const currentUserKarmaInfo = { ...user, recentKarmaInfo: currentKarmaInfo };
  const previousUserKarmaInfo = { ...user, recentKarmaInfo: previousKarmaInfo, karma: previousUserKarma };

  return { currentUserKarmaInfo, previousUserKarmaInfo };
}

function getRateLimitStrictnessComparisons(userKarmaInfoWindow: UserKarmaInfoWindow) {
  const { currentUserKarmaInfo, previousUserKarmaInfo } = userKarmaInfoWindow;

  const commentRateLimits = forumSelect(autoCommentRateLimits);
  const postRateLimits = forumSelect(autoPostRateLimits);

  const activeCommentRateLimits = getActiveRateLimits(currentUserKarmaInfo, commentRateLimits);
  const previousCommentRateLimits = getActiveRateLimits(previousUserKarmaInfo, commentRateLimits);

  const activePostRateLimits = getActiveRateLimits(currentUserKarmaInfo, postRateLimits);
  const previousPostRateLimits = getActiveRateLimits(previousUserKarmaInfo, postRateLimits);

  const commentRateLimitComparison = areNewRateLimitsStricter(activeCommentRateLimits, previousCommentRateLimits);
  const postRateLimitComparison = areNewRateLimitsStricter(activePostRateLimits, previousPostRateLimits);

  return { commentRateLimitComparison, postRateLimitComparison };
}

async function getVotesForComparison(userId: string, currentVotes: RecentVoteInfo[]) {
  currentVotes = currentVotes.sort((a, b) => moment(b.votedAt).diff(a.votedAt));
  const [mostRecentVoteInfo] = currentVotes;

  const comparisonVotes = [...currentVotes];
  comparisonVotes.shift();

  if (documentOnlyHasSelfVote(userId, mostRecentVoteInfo, currentVotes)) {
    // Check whether it was a self-vote on a post or comment
    const { collectionName } = mostRecentVoteInfo;
    // Fetch all the votes on the post or comment that would've been pushed out of the 20-item window by this one, and use those instead
    const votesRepo = new VotesRepo();
    const votesOnNextMostRecentDocument = await votesRepo.getVotesOnPastContent(userId, collectionName, mostRecentVoteInfo.postedAt);
    comparisonVotes.push(...votesOnNextMostRecentDocument);
  }

  return comparisonVotes;
}

export async function compareCachedRateLimitsForReview2(userIds: string[], context: ResolverContext) {
  // We can't use a loader here because we need the user's karma which was just updated by this vote
  const votedOnUsers = await Users.find({ _id: { $in: userIds } }).fetch();

  const votesRepo = new VotesRepo();

  void Promise.all(votedOnUsers.map(async (user) => {
    const allVotes = await votesRepo.getVotesOnRecentContent(user._id);
    const comparisonVotes = await getVotesForComparison(user._id, allVotes);

    const userKarmaInfoWindow = getCurrentAndPreviousUserKarmaInfo(user, allVotes, comparisonVotes);
    const { commentRateLimitComparison, postRateLimitComparison } = getRateLimitStrictnessComparisons(userKarmaInfoWindow);

    triggerReviewForStricterRateLimits(user._id, commentRateLimitComparison, postRateLimitComparison, context);
  }));
}
