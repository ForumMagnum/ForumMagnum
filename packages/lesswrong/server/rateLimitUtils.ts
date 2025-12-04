import moment from "moment"
import { getTimeframeForRateLimit } from "../lib/collections/moderatorActions/helpers"
import { EXEMPT_FROM_RATE_LIMITS, MODERATOR_ACTION_TYPES, PostAndCommentRateLimitTypes, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK, STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT, postAndCommentRateLimits } from "@/lib/collections/moderatorActions/constants"
import { forumSelect } from "../lib/forumTypeUtils"
import { userIsAdmin, userIsMemberOf } from "../lib/vulcan-users/permissions"
import { autoCommentRateLimits, autoPostRateLimits } from "../lib/rateLimits/constants"
import type { AutoRateLimit, CommentAutoRateLimit, PostAutoRateLimit, RateLimitComparison, RateLimitFeatures, RateLimitInfo, RecentKarmaInfo, RecentVoteInfo, UserKarmaInfoWindow, UserRateLimit } from "../lib/rateLimits/types"
import { calculateRecentKarmaInfo, documentOnlyHasSelfVote, getActiveRateLimits, getAutoRateLimitInfo, getCurrentAndPreviousUserKarmaInfo, getMaxAutoLimitHours, getModRateLimitInfo, getRateLimitStrictnessComparisons, getStrictestRateLimitInfo, getManualRateLimitInfo, getManualRateLimitIntervalHours, getDownvoteRatio } from "../lib/rateLimits/utils"
import { appendToSunshineNotes } from "../lib/collections/users/helpers"
import { isNonEmpty } from "@/lib/utils/typeGuardUtils"
import type { NonEmptyArray } from "fp-ts/lib/NonEmptyArray"
import { backgroundTask } from "./utils/backgroundTask"

/**
 * Fetches the most recent, active rate limit affecting a user.
 */
function getModeratorRateLimit(userId: string, context: ResolverContext) {
  const { ModeratorActions } = context;
  return ModeratorActions.findOne({
    userId: userId,
    type: {$in: postAndCommentRateLimits},
    $or: [{endedAt: null}, {endedAt: {$gt: new Date()}}]
  }, {
    sort: {
      createdAt: -1
    }
  }) as Promise<DbModeratorAction & {type: PostAndCommentRateLimitTypes} | null>
}

async function userHasActiveModeratorActionOfType(userId: string, moderatorActionType: keyof typeof MODERATOR_ACTION_TYPES, context: ResolverContext): Promise<boolean> {
  const { ModeratorActions } = context;
  const action = await ModeratorActions.findOne({
    userId: userId,
    type: moderatorActionType,
    $or: [{endedAt: null}, {endedAt: {$gt: new Date()}}]
  });
  return !!action;
}

async function getModRateLimitHours(userId: string, context: ResolverContext): Promise<number> {
  const moderatorRateLimit = await getModeratorRateLimit(userId, context)
  return moderatorRateLimit ? getTimeframeForRateLimit(moderatorRateLimit?.type) : 0
}

async function getModPostSpecificRateLimitHours(userId: string, context: ResolverContext): Promise<number> {
  const hasPostSpecificRateLimit = await userHasActiveModeratorActionOfType(userId, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK, context)
  return hasPostSpecificRateLimit ? getTimeframeForRateLimit(RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK) : 0
}

async function getPostsInTimeframe(user: DbUser, maxHours: number, context: ResolverContext) {
  const { Posts } = context;
  return await Posts.find({
    userId:user._id, 
    draft: false,
    isEvent: false, // I've never seen event-spam, and sometimes people need to make 100+ events for special occassions -- Ray
    postedAt: {$gte: moment().subtract(maxHours, 'hours').toDate()}
  }, {sort: {postedAt: -1}, projection: {postedAt: 1}}).fetch()
}

function getManualRateLimit<T extends DbUserRateLimit['type']>(userId: string, type: T, context: ResolverContext) {
  const { UserRateLimits } = context;
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

async function getCommentsInTimeframe(userId: string, maxTimeframe: number, context: ResolverContext) {
  const { Comments } = context;
  const commentsInTimeframe = await Comments.find(
    { userId: userId,
      draft: false,
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
  const { ModeratorActions } = context;
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
  const userIsNotCoauthor = !post.coauthorUserIds.includes(userId)
  return !(userIsNotPrimaryAuthor && userIsNotCoauthor)
}

function getModPostSpecificRateLimitInfo (comments: Array<DbComment>, modPostSpecificRateLimitHours: number, postId: string | null, userIsAuthor: boolean): RateLimitInfo|null {
  const eligibleForCommentOnSpecificPostRateLimit = (modPostSpecificRateLimitHours > 0) && !userIsAuthor;
  const commentsOnPost = comments.filter(comment => comment.postId === postId)

  return eligibleForCommentOnSpecificPostRateLimit ? getModRateLimitInfo(commentsOnPost, modPostSpecificRateLimitHours, 3) : null
}

async function getCommentsOnOthersPosts(comments: Array<DbComment>, userId: string, context: ResolverContext) {
  const { Posts } = context;
  const postIds = comments
    .map(comment => comment.postId)
    .filter(postId => !!postId) //exclude null post IDs (eg comments on tags)

  const postsNotAuthoredByCommenter = postIds.length>0
    ? await Posts.find(
        {_id: {$in: postIds}, userId: {$ne: userId}},
        undefined,
        {_id:1, coauthorUserIds:1}
      ).fetch()
    : [];

  // right now, filtering out coauthors doesn't work (due to a bug in our query builder), so we're doing that manually
  const postsNotCoauthoredByCommenter = postsNotAuthoredByCommenter.filter(post => !post.coauthorUserIds.includes(userId))
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
    getCommentsOnOthersPosts(commentsInTimeframe, user._id, context)
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

async function shouldIgnorePostRateLimit(user: DbUser, context: ResolverContext) {
  const { ModeratorActions } = context;
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment") || userIsMemberOf(user, "canBypassPostRateLimit")) return true

  const isRateLimitExempt = await ModeratorActions.findOne({
    userId: user._id,
    type: EXEMPT_FROM_RATE_LIMITS,
    endedAt: { $gt: new Date() }
  })
  if (isRateLimitExempt) return true
  
  return false
}

export async function rateLimitDateWhenUserNextAbleToPost(user: DbUser, context: ResolverContext): Promise<RateLimitInfo|null> {
  // Admins and Sunshines aren't rate-limited
  if (await shouldIgnorePostRateLimit(user, context)) return null;
  
  // does the user have a moderator-assigned rate limit?
  // also get the recent karma info, we'll need it later
  const [modRateLimitHours, manualPostRateLimit, recentKarmaInfo] = await Promise.all([
    getModRateLimitHours(user._id, context),
    getManualRateLimit(user._id, 'allPosts', context),
    getRecentKarmaInfo(user._id, context)
  ]);

  // what's the longest rate limit timeframe being evaluated?
  const manualPostRateLimitHours = getManualRateLimitIntervalHours(manualPostRateLimit);
  const maxPostAutolimitHours = getMaxAutoLimitHours(forumSelect(autoPostRateLimits));
  const maxHours = Math.max(modRateLimitHours, manualPostRateLimitHours, maxPostAutolimitHours);

  // fetch the posts from within the maxTimeframe
  const postsInTimeframe = await getPostsInTimeframe(user, maxHours, context);

  const rateLimitInfos = getPostRateLimitInfos(user, postsInTimeframe, modRateLimitHours, manualPostRateLimit, recentKarmaInfo);

  return getStrictestRateLimitInfo(rateLimitInfos)
}

export async function rateLimitDateWhenUserNextAbleToComment(user: DbUser, postId: string|null, context: ResolverContext): Promise<RateLimitInfo|null> {
  const ignoreRateLimits = await shouldIgnoreCommentRateLimit(user, postId, context);
  if (ignoreRateLimits) return null;

  // does the user have a moderator-assigned rate limit?
  // also get the recent karma info, we'll need it later
  const [modRateLimitHours, modPostSpecificRateLimitHours, manualCommentRateLimit, recentKarmaInfo] = await Promise.all([
    getModRateLimitHours(user._id, context),
    getModPostSpecificRateLimitHours(user._id, context),
    getManualRateLimit(user._id, 'allComments', context),
    getRecentKarmaInfo(user._id, context)
  ]);

  const manualCommentRateLimitHours = getManualRateLimitIntervalHours(manualCommentRateLimit);

  // what's the longest rate limit timeframe being evaluated?
  const maxCommentAutolimitHours = getMaxAutoLimitHours(forumSelect(autoCommentRateLimits))
  const maxHours = Math.max(modRateLimitHours, modPostSpecificRateLimitHours, maxCommentAutolimitHours, manualCommentRateLimitHours);

  // fetch the comments from within the maxTimeframe
  const commentsInTimeframe = await getCommentsInTimeframe(user._id, maxHours, context);

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

export async function getRecentKarmaInfo(userId: string, context: ResolverContext): Promise<RecentKarmaInfo> {
  const allVotes = await context.repos.votes.getVotesOnRecentContent(userId)
  return calculateRecentKarmaInfo(userId, allVotes)
}

async function getVotesForComparison(userId: string, currentVotes: NonEmptyArray<RecentVoteInfo>, context: ResolverContext) {
  currentVotes = currentVotes.sort((a, b) => moment(b.votedAt).diff(a.votedAt));
  const [mostRecentVoteInfo] = currentVotes;

  const comparisonVotes = [...currentVotes];
  comparisonVotes.shift();

  if (documentOnlyHasSelfVote(userId, mostRecentVoteInfo, currentVotes)) {
    // Check whether it was a self-vote on a post or comment
    const { collectionName } = mostRecentVoteInfo;
    // Fetch all the votes on the post or comment that would've been pushed out of the 20-item window by this one, and use those instead
    const votesOnNextMostRecentDocument = await context.repos.votes.getVotesOnPreviousContentItem(userId, collectionName, mostRecentVoteInfo.postedAt);
    comparisonVotes.push(...votesOnNextMostRecentDocument);
  }

  return comparisonVotes;
}

async function recordRateLimitEvent(
  userId: string,
  eventName: "rateLimitActivated" | "rateLimitDeactivated",
  rateLimit: CommentAutoRateLimit | PostAutoRateLimit,
  documentId: string,
  collectionName: CollectionNameString,
  triggeredAt: Date,
  context: ResolverContext
) {
  // Only record events for rolling and timed rate limits
  // Static rate limits are always displayed separately and don't need events
  if (rateLimit.rateLimitCategory === "static") {
    return;
  }

  const { LWEvents } = context;
  await LWEvents.rawInsert({
    name: eventName,
    userId,
    documentId,
    important: true,
    intercom: false,
    properties: {
      collectionName,
      actionType: rateLimit.actionType,
      rateLimitType: rateLimit.rateLimitType,
      rateLimitCategory: rateLimit.rateLimitCategory,
      itemsPerTimeframe: rateLimit.itemsPerTimeframe,
      timeframeLength: rateLimit.timeframeLength,
      timeframeUnit: rateLimit.timeframeUnit,
      rateLimitMessage: rateLimit.rateLimitMessage,
      triggeredAt: triggeredAt.toISOString()
    }
  });
}

async function createModeratorActionForStricterRateLimit(userId: string, autoRateLimit: AutoRateLimit, context: ResolverContext) {
  const { actionType, itemsPerTimeframe, timeframeUnit, timeframeLength } = autoRateLimit;
  const moderatorActionType = actionType === 'Comments'
    ? STRICTER_COMMENT_AUTOMOD_RATE_LIMIT
    : STRICTER_POST_AUTOMOD_RATE_LIMIT;

  // Importing these directly causes a crash-on-startup dependency cycle; probably something from this file
  // is imported and used directly in a collection schema declaration.
  const { createModeratorAction } = await import("./collections/moderatorActions/mutations");
  const { createAdminContext } = await import("./vulcan-lib/createContexts");
  
  // Use admin context instead to avoid leaking bits about whose vote on this user triggered the stricter rate limit
  const adminContext = createAdminContext();

  await createModeratorAction({
    data: {
      type: moderatorActionType,
      userId,
    },
  }, adminContext);

  const itemType = actionType === 'Comments' ? 'comment' : 'post';
  const sunshineNote = `User triggered a stricter ${itemsPerTimeframe} ${itemType}(s) per ${timeframeLength} ${timeframeUnit} rate limit`;

  await appendToSunshineNotes({
    moderatedUserId: userId,
    adminName: 'Automod',
    text: sunshineNote,
    context: adminContext,
  })
}

function triggerReviewForStricterRateLimits(
  userId: string,
  commentRateLimitComparison: RateLimitComparison<CommentAutoRateLimit>,
  postRateLimitComparison: RateLimitComparison<PostAutoRateLimit>,
  documentId: string,
  collectionName: CollectionNameString,
  triggeredAt: Date,
  context: ResolverContext
) {
  if (!commentRateLimitComparison.isStricter && !postRateLimitComparison.isStricter) {
    return;
  }

  if (commentRateLimitComparison.isStricter) {
    const { strictestNewRateLimit } = commentRateLimitComparison;
    backgroundTask(createModeratorActionForStricterRateLimit(userId, strictestNewRateLimit, context))
    backgroundTask(recordRateLimitEvent(userId, "rateLimitActivated", strictestNewRateLimit, documentId, collectionName, triggeredAt, context));
  }

  if (postRateLimitComparison.isStricter) {
    const { strictestNewRateLimit } = postRateLimitComparison;
    backgroundTask(createModeratorActionForStricterRateLimit(userId, strictestNewRateLimit, context))
    backgroundTask(recordRateLimitEvent(userId, "rateLimitActivated", strictestNewRateLimit, documentId, collectionName, triggeredAt, context));
  }
}

export async function checkForStricterRateLimits(userId: string, documentId: string, collectionName: CollectionNameString, context: ResolverContext) {
  const { Users } = context;
  // We can't use a loader here because we need the user's karma which was just updated by this vote
  const votedOnUser = await Users.findOne({ _id: userId });
  if (!votedOnUser) {
    // eslint-disable-next-line no-console
    console.error(`Couldn't find user with id ${userId} when checking for stricter rate limits after a vote`);
    return;
  }

  const allVotes = await context.repos.votes.getVotesOnRecentContent(votedOnUser._id);

  // This might happen if a new user creates a draft post as their first thing
  // That triggers a self-vote, but one that gets filtered out of getVotesOnRecentContent
  // We check not-isNonEmpty rather than isEmpty because the type guard only works properly in that direction
  if (!isNonEmpty(allVotes)) {
    return;
  }

  const comparisonVotes = await getVotesForComparison(votedOnUser._id, allVotes, context);

  const userKarmaInfoWindow = getCurrentAndPreviousUserKarmaInfo(votedOnUser, allVotes, comparisonVotes);
  const { commentRateLimitComparison, postRateLimitComparison } = getRateLimitStrictnessComparisons(userKarmaInfoWindow);

  // Use the most recent vote date as the trigger time
  const triggeredAt = allVotes[0].votedAt;

  triggerReviewForStricterRateLimits(votedOnUser._id, commentRateLimitComparison, postRateLimitComparison, documentId, collectionName, triggeredAt, context);

  // Also check if rate limits were loosened (deactivated)
  backgroundTask(checkForLoosenedRateLimits(votedOnUser._id, userKarmaInfoWindow, documentId, collectionName, triggeredAt, context));
}

async function checkForLoosenedRateLimits(userId: string, userKarmaInfoWindow: UserKarmaInfoWindow, documentId: string, collectionName: CollectionNameString, triggeredAt: Date, context: ResolverContext) {
  const { currentUserKarmaInfo, previousUserKarmaInfo } = userKarmaInfoWindow;

  const commentRateLimits = forumSelect(autoCommentRateLimits);
  const postRateLimits = forumSelect(autoPostRateLimits);

  if (!commentRateLimits || !postRateLimits) return;

  const currentCommentRateLimits = getActiveRateLimits(currentUserKarmaInfo, commentRateLimits);
  const previousCommentRateLimits = getActiveRateLimits(previousUserKarmaInfo, commentRateLimits);

  const currentPostRateLimits = getActiveRateLimits(currentUserKarmaInfo, postRateLimits);
  const previousPostRateLimits = getActiveRateLimits(previousUserKarmaInfo, postRateLimits);

  // Find rate limits that were active before but aren't active now
  for (const previousLimit of previousCommentRateLimits) {
    const stillActive = currentCommentRateLimits.some(current =>
      current.rateLimitType === previousLimit.rateLimitType
    );
    if (!stillActive) {
      backgroundTask(recordRateLimitEvent(userId, "rateLimitDeactivated", previousLimit, documentId, collectionName, triggeredAt, context));
    }
  }

  for (const previousLimit of previousPostRateLimits) {
    const stillActive = currentPostRateLimits.some(current =>
      current.rateLimitType === previousLimit.rateLimitType
    );
    if (!stillActive) {
      backgroundTask(recordRateLimitEvent(userId, "rateLimitDeactivated", previousLimit, documentId, collectionName, triggeredAt, context));
    }
  }
}
