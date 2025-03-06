import moment from "moment"
import Comments from "../server/collections/comments/collection"
import { getModeratorRateLimit, getTimeframeForRateLimit, userHasActiveModeratorActionOfType } from "../lib/collections/moderatorActions/helpers"
import { EXEMPT_FROM_RATE_LIMITS, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK } from "../lib/collections/moderatorActions/schema"
import Posts from "../server/collections/posts/collection"
import UserRateLimits from "../server/collections/userRateLimits/collection"
import { forumSelect } from "../lib/forumTypeUtils"
import { userIsAdmin, userIsMemberOf } from "../lib/vulcan-users/permissions"
import VotesRepo from "./repos/VotesRepo"
import { autoCommentRateLimits, autoPostRateLimits } from "../lib/rateLimits/constants"
import type { CommentAutoRateLimit, PostAutoRateLimit, RateLimitComparison, RateLimitFeatures, RateLimitInfo, RecentKarmaInfo, RecentVoteInfo, UserRateLimit } from "../lib/rateLimits/types"
import { calculateRecentKarmaInfo, documentOnlyHasSelfVote, getAutoRateLimitInfo, getCurrentAndPreviousUserKarmaInfo, getMaxAutoLimitHours, getModRateLimitInfo, getRateLimitStrictnessComparisons, getStrictestRateLimitInfo, getManualRateLimitInfo, getManualRateLimitIntervalHours, shouldIgnorePostRateLimit } from "../lib/rateLimits/utils"
import Users from "../server/collections/users/collection"
import { triggerReview } from "./callbacks/sunshineCallbackUtils"
import { appendToSunshineNotes } from "../lib/collections/users/helpers"
import { isNonEmpty } from "fp-ts/Array"
import type { NonEmptyArray } from "fp-ts/lib/NonEmptyArray"
import { getDownvoteRatio } from "../components/sunshineDashboard/UsersReviewInfoCard"
import { ModeratorActions } from "../server/collections/moderatorActions/collection"

async function getModRateLimitHours(userId: string): Promise<number> {
  const moderatorRateLimit = await getModeratorRateLimit(userId)
  return moderatorRateLimit ? getTimeframeForRateLimit(moderatorRateLimit?.type) : 0
}

async function getModPostSpecificRateLimitHours(userId: string): Promise<number> {
  const hasPostSpecificRateLimit = await userHasActiveModeratorActionOfType(userId, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK)
  return hasPostSpecificRateLimit ? getTimeframeForRateLimit(RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK) : 0
}

async function getPostsInTimeframe(user: DbUser, maxHours: number) {
  return await Posts.find({
    userId:user._id, 
    draft: false,
    isEvent: false, // I've never seen event-spam, and sometimes people need to make 100+ events for special occassions -- Ray
    postedAt: {$gte: moment().subtract(maxHours, 'hours').toDate()}
  }, {sort: {postedAt: -1}, projection: {postedAt: 1}}).fetch()
}

function getManualRateLimit<T extends DbUserRateLimit['type']>(userId: string, type: T) {
  return UserRateLimits.findOne({
    userId,
    type,
    $or: [{endedAt: null}, {endedAt: {$gt: new Date()}}]
  }, {
    sort: {
      createdAt: -1
    }
  }) as Promise<UserRateLimit<T> | null>;
}

function getPostRateLimitInfos(
  user: DbUser,
  postsInTimeframe: Array<DbPost>,
  modRateLimitHours: number,
  userPostRateLimit: UserRateLimit<"allPosts">|null,
  recentKarmaInfo: RecentKarmaInfo
): Array<RateLimitInfo> {
  // for each rate limit, get the next date that user could post  
  const userPostRateLimitInfo = getManualRateLimitInfo(userPostRateLimit, postsInTimeframe)

  const features = {
    ...recentKarmaInfo, 
    downvoteRatio: getDownvoteRatio(user)
  } 

  const autoRatelimits = forumSelect(autoPostRateLimits)
  const autoRateLimitInfos = autoRatelimits?.map(
    rateLimit => getAutoRateLimitInfo(user, features, rateLimit, postsInTimeframe)
  ) ?? []

  // modRateLimitInfo is sort of deprecated, but we're still using it for at least a couple months
  const modRateLimitInfo = getModRateLimitInfo(postsInTimeframe, modRateLimitHours, 1)

  return [modRateLimitInfo, userPostRateLimitInfo, ...autoRateLimitInfos].filter((rateLimit): rateLimit is RateLimitInfo => rateLimit !== null)
}

async function getCommentsInTimeframe(userId: string, maxTimeframe: number) {
  const commentsInTimeframe = await Comments.find(
    { userId: userId, 
      postedAt: {$gte: moment().subtract(maxTimeframe, 'hours').toDate()},
      debateResponse: {$ne: true}
    }, {
      sort: {postedAt: -1}, 
      projection: {postId: 1, postedAt: 1}
    }
  ).fetch()
  return commentsInTimeframe
}

/**
 * Checks if the user is exempt from commenting rate limits (optionally, for the given post).
 *
 * Admins and mods are always exempt.
 * If the post has "ignoreRateLimits" set, then all users are exempt.
 * On forums other than the EA Forum, the post author is always exempt on their own posts.
 */
async function shouldIgnoreCommentRateLimit(user: DbUser, postId: string|null, context: ResolverContext): Promise<boolean> {
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment")) {
    return true;
  }
  if (postId) {
    const post = await context.loaders.Posts.load(postId);
    if (post?.ignoreRateLimits) {
      return true;
    }
  }

  const isRateLimitExempt = await ModeratorActions.findOne({
    userId: user._id,
    type: EXEMPT_FROM_RATE_LIMITS,
    endedAt: { $gt: new Date() }
  })
  if (isRateLimitExempt) return true

  return false;
}

async function getUserIsAuthor(userId: string, postId: string|null, context: ResolverContext): Promise<boolean> {
  if (!postId) return false
  const post = await context.loaders.Posts.load(postId);
  if (!post) return false
  const userIsNotPrimaryAuthor = post.userId !== userId
  const userIsNotCoauthor = !post.coauthorStatuses || post.coauthorStatuses.every(coauthorStatus => coauthorStatus.userId !== userId)
  return !(userIsNotPrimaryAuthor && userIsNotCoauthor)
}

function getModPostSpecificRateLimitInfo (comments: Array<DbComment>, modPostSpecificRateLimitHours: number, postId: string | null, userIsAuthor: boolean): RateLimitInfo|null {
  const eligibleForCommentOnSpecificPostRateLimit = (modPostSpecificRateLimitHours > 0) && !userIsAuthor;
  const commentsOnPost = comments.filter(comment => comment.postId === postId)

  return eligibleForCommentOnSpecificPostRateLimit ? getModRateLimitInfo(commentsOnPost, modPostSpecificRateLimitHours, 3) : null
}

async function getCommentsOnOthersPosts(comments: Array<DbComment>, userId: string) {
  const postIds = comments
    .map(comment => comment.postId)
    .filter(postId => !!postId) //exclude null post IDs (eg comments on tags)

  const postsNotAuthoredByCommenter = postIds.length>0
    ? await Posts.find(
        {_id: {$in: postIds}, userId: {$ne: userId}},
        {projection: {_id:1, coauthorStatuses:1}}
      ).fetch()
    : [];

  // right now, filtering out coauthors doesn't work (due to a bug in our query builder), so we're doing that manually
  const postsNotCoauthoredByCommenter = postsNotAuthoredByCommenter.filter(post => !post.coauthorStatuses || post.coauthorStatuses.every(coauthorStatus => coauthorStatus.userId !== userId))
  const postsNotAuthoredByCommenterIds = postsNotCoauthoredByCommenter.map(post => post._id)
  const commentsOnNonauthorPosts = comments.filter(comment => comment.postId && postsNotAuthoredByCommenterIds.includes(comment.postId))
  return commentsOnNonauthorPosts
}

async function getCommentRateLimitInfos({commentsInTimeframe, user, modRateLimitHours, modPostSpecificRateLimitHours, postId, manualCommentRateLimit, features, context}: {
  commentsInTimeframe: Array<DbComment>,
  user: DbUser,
  modRateLimitHours: number,
  modPostSpecificRateLimitHours: number,
  manualCommentRateLimit: UserRateLimit<'allComments'> | null,
  postId: string | null,
  features: RateLimitFeatures,
  context: ResolverContext
}): Promise<Array<RateLimitInfo>> {
  const [userIsAuthor, commentsOnOthersPostsInTimeframe] = await Promise.all([
    getUserIsAuthor(user._id, postId, context),
    getCommentsOnOthersPosts(commentsInTimeframe, user._id)
  ])

  // Deprecated! TODO: remove!
  const modGeneralRateLimitInfo = getModRateLimitInfo(commentsOnOthersPostsInTimeframe, modRateLimitHours, 1)

  const modSpecificPostRateLimitInfo = getModPostSpecificRateLimitInfo(commentsOnOthersPostsInTimeframe, modPostSpecificRateLimitHours, postId, userIsAuthor)

  const manualRateLimitInfo = userIsAuthor ? null : getManualRateLimitInfo(manualCommentRateLimit, commentsOnOthersPostsInTimeframe) 

  const autoRateLimits = forumSelect(autoCommentRateLimits)
  const filteredAutoRateLimits = autoRateLimits?.filter(rateLimit => {
    if (userIsAuthor) return rateLimit.appliesToOwnPosts
    return true 
  })

  const autoRateLimitInfos = filteredAutoRateLimits?.map(
    rateLimit => getAutoRateLimitInfo(user, features, rateLimit, commentsInTimeframe)
  ) ?? []
  return [modGeneralRateLimitInfo, modSpecificPostRateLimitInfo, manualRateLimitInfo, ...autoRateLimitInfos].filter((rateLimit): rateLimit is RateLimitInfo => rateLimit !== null)
}

export async function rateLimitDateWhenUserNextAbleToPost(user: DbUser): Promise<RateLimitInfo|null> {
  // Admins and Sunshines aren't rate-limited
  if (await shouldIgnorePostRateLimit(user)) return null;
  
  // does the user have a moderator-assigned rate limit?
  // also get the recent karma info, we'll need it later
  const [modRateLimitHours, manualPostRateLimit, recentKarmaInfo] = await Promise.all([
    getModRateLimitHours(user._id),
    getManualRateLimit(user._id, 'allPosts'),
    getRecentKarmaInfo(user._id)
  ]);

  // what's the longest rate limit timeframe being evaluated?
  const manualPostRateLimitHours = getManualRateLimitIntervalHours(manualPostRateLimit);
  const maxPostAutolimitHours = getMaxAutoLimitHours(forumSelect(autoPostRateLimits));
  const maxHours = Math.max(modRateLimitHours, manualPostRateLimitHours, maxPostAutolimitHours);

  // fetch the posts from within the maxTimeframe
  const postsInTimeframe = await getPostsInTimeframe(user, maxHours);

  const rateLimitInfos = getPostRateLimitInfos(user, postsInTimeframe, modRateLimitHours, manualPostRateLimit, recentKarmaInfo);

  return getStrictestRateLimitInfo(rateLimitInfos)
}

export async function rateLimitDateWhenUserNextAbleToComment(user: DbUser, postId: string|null, context: ResolverContext): Promise<RateLimitInfo|null> {
  const ignoreRateLimits = await shouldIgnoreCommentRateLimit(user, postId, context);
  if (ignoreRateLimits) return null;

  // does the user have a moderator-assigned rate limit?
  // also get the recent karma info, we'll need it later
  const [modRateLimitHours, modPostSpecificRateLimitHours, manualCommentRateLimit, recentKarmaInfo] = await Promise.all([
    getModRateLimitHours(user._id),
    getModPostSpecificRateLimitHours(user._id),
    getManualRateLimit(user._id, 'allComments'),
    getRecentKarmaInfo(user._id)
  ]);

  const manualCommentRateLimitHours = getManualRateLimitIntervalHours(manualCommentRateLimit);

  // what's the longest rate limit timeframe being evaluated?
  const maxCommentAutolimitHours = getMaxAutoLimitHours(forumSelect(autoCommentRateLimits))
  const maxHours = Math.max(modRateLimitHours, modPostSpecificRateLimitHours, maxCommentAutolimitHours, manualCommentRateLimitHours);

  // fetch the comments from within the maxTimeframe
  const commentsInTimeframe = await getCommentsInTimeframe(user._id, maxHours);

  const features = {
    ...recentKarmaInfo, 
    downvoteRatio: getDownvoteRatio(user)
  }

  const rateLimitInfos = await getCommentRateLimitInfos({
    commentsInTimeframe,
    user,
    modRateLimitHours,
    modPostSpecificRateLimitHours,
    postId,
    manualCommentRateLimit,
    features,
    context,
  });

  return getStrictestRateLimitInfo(rateLimitInfos)
}

export async function getRecentKarmaInfo (userId: string): Promise<RecentKarmaInfo> {
  const votesRepo = new VotesRepo()
  const allVotes = await votesRepo.getVotesOnRecentContent(userId)
  return calculateRecentKarmaInfo(userId, allVotes)
}

async function getVotesForComparison(userId: string, currentVotes: NonEmptyArray<RecentVoteInfo>) {
  currentVotes = currentVotes.sort((a, b) => moment(b.votedAt).diff(a.votedAt));
  const [mostRecentVoteInfo] = currentVotes;

  const comparisonVotes = [...currentVotes];
  comparisonVotes.shift();

  if (documentOnlyHasSelfVote(userId, mostRecentVoteInfo, currentVotes)) {
    // Check whether it was a self-vote on a post or comment
    const { collectionName } = mostRecentVoteInfo;
    // Fetch all the votes on the post or comment that would've been pushed out of the 20-item window by this one, and use those instead
    const votesRepo = new VotesRepo();
    const votesOnNextMostRecentDocument = await votesRepo.getVotesOnPreviousContentItem(userId, collectionName, mostRecentVoteInfo.postedAt);
    comparisonVotes.push(...votesOnNextMostRecentDocument);
  }

  return comparisonVotes;
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

export async function checkForStricterRateLimits(userId: string, context: ResolverContext) {
  // We can't use a loader here because we need the user's karma which was just updated by this vote
  const votedOnUser = await Users.findOne({ _id: userId });
  if (!votedOnUser) {
    // eslint-disable-next-line no-console
    console.error(`Couldn't find user with id ${userId} when checking for stricter rate limits after a vote`);
    return;
  }

  const votesRepo = new VotesRepo();

  const allVotes = await votesRepo.getVotesOnRecentContent(votedOnUser._id);

  // This might happen if a new user creates a draft post as their first thing
  // That triggers a self-vote, but one that gets filtered out of getVotesOnRecentContent
  // We check not-isNonEmpty rather than isEmpty because the type guard only works properly in that direction
  if (!isNonEmpty(allVotes)) {
    return;
  }

  const comparisonVotes = await getVotesForComparison(votedOnUser._id, allVotes);

  const userKarmaInfoWindow = getCurrentAndPreviousUserKarmaInfo(votedOnUser, allVotes, comparisonVotes);
  const { commentRateLimitComparison, postRateLimitComparison } = getRateLimitStrictnessComparisons(userKarmaInfoWindow);

  triggerReviewForStricterRateLimits(votedOnUser._id, commentRateLimitComparison, postRateLimitComparison, context);
}
