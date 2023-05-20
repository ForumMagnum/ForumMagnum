import { Posts } from '../../lib/collections/posts'
import { userIsAdmin, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { getCollectionHooks } from '../mutationCallbacks';
import Comments from '../../lib/collections/comments/collection';
import { RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK } from '../../lib/collections/moderatorActions/schema';
import { getModeratorRateLimit, getTimeframeForRateLimit, userHasActiveModeratorActionOfType } from '../../lib/collections/moderatorActions/helpers';
import moment from 'moment';
import Users from '../../lib/collections/users/collection';
import { captureEvent } from '../../lib/analyticsEvents';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

type IntervalUnitType = 'seconds'|'minutes'|'hours'|'days'|'weeks'|'months'
export type RateLimitType = "moderator"|"lowKarma"|"universal"|"downvoteRatio"
 
export type RateLimitInfo = {
  nextEligible: Date,
  rateLimitType: RateLimitType,
  rateLimitMessage: string,
}

/* 
Each forum can set a list of automatically applied rate limits. 

Whenever a user submits a post or comment, the server checks if any of the listed AutoRateLimits 
apply to that user/post/comment.

AutoRateLimits check how documents the user has posted in a recent time interval, and prevents them
from posting more if they've posted more than the alloted number of itemsPerInterval.

AutoRateLimits can take in an optional karmaThreshold or downvoteRatio parameter. If set, the AutoRateLimit
applies to users who meet that karmaThreshold and/or downvoteRatio criteria. If both params are set, the 
rate limit only applies if both conditions are met. If neither param is set, the rate limit applies to all users.
*/
interface AutoRateLimit {
  karmaThreshold?: number, // if set, the rate limit will only apply to users with karma less than the threshold
  downvoteRatio?: number, // if set, the rate limit will only apply to users who's ratio of received downvotes / total votes is higher than the listed threshold
  timeframeLength: number, // how long the time timeframe is (measured in the intervalUnit, below)
  timeframeUnit: IntervalUnitType, // measuring units for the timeframe (i.e. minutes, hours, days)
  itemsPerTimeframe: number, // number of items a user can post/comment/etc before triggering rate limit
  rateLimitType: RateLimitType // short name used in analytics db
  rateLimitMessage: string // A message displayed to users when they are rate limited
}

type ForumAutoRateLimits = {
  posts?: Array<AutoRateLimit>,
  comments?: Array<AutoRateLimit>,
}

// eaforum look here
// Rate limits for each forum
const autoRateLimits: ForumOptions<ForumAutoRateLimits> = {
  EAForum: {
    posts: [
      {
        timeframeUnit: 'days',
        timeframeLength: 1,
        itemsPerTimeframe: 5,
        rateLimitType: "universal",
        rateLimitMessage: "Users cannot post more than 5 posts a day"
      }
    ],
    comments: [
      {
        // short rate limit on commenting to prevent accidental double-commenting
        timeframeUnit: 'seconds',
        timeframeLength: 8,
        itemsPerTimeframe: 1,
        rateLimitType: "universal",
        rateLimitMessage: "Users cannot submit more than 1 comment every 8 seconds to prevent double-posting.",
      },
      {
        karmaThreshold: 30,
        timeframeUnit: 'minutes',
        timeframeLength: 30,
        itemsPerTimeframe: 4,
        rateLimitType: "lowKarma",
        rateLimitMessage: "You'll be able to post more comments as your karma increases"
      },
      {
        downvoteRatio: .3,
        timeframeUnit: 'minutes',
        timeframeLength: 30,
        itemsPerTimeframe: 4,
        rateLimitType: "downvoteRatio",
        rateLimitMessage: "You'll be able to post more comments as your karma increases"
      }
    ] 
  },
  LessWrong: {
    posts: [
      {
        karmaThreshold: 500,
        timeframeUnit: 'days',
        timeframeLength: 1,
        itemsPerTimeframe: 5,
        rateLimitType: "universal",
        rateLimitMessage: "Users with less than 500 karma cannot post more than 5 posts a day"
      },
      {
        karmaThreshold: 10,
        timeframeUnit: 'weeks',
        timeframeLength: 1,
        itemsPerTimeframe: 2,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "As you gain more karma you'll be able to post more frequently."
      }, 
      {
        karmaThreshold: 0,
        timeframeUnit: 'weeks',
        timeframeLength: 1,
        itemsPerTimeframe: 1,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Negative karma users are limited to 1 post per week."
      }, 
      {
        karmaThreshold: -30,
        timeframeUnit: 'months',
        timeframeLength: 1,
        itemsPerTimeframe: 1,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Users with less than -30 karma users can only post once per month"
      },
    ],
    comments: [
      {
        timeframeUnit: 'seconds',
        timeframeLength: 8,
        itemsPerTimeframe: 1,
        rateLimitType: "universal",
        rateLimitMessage: "Users cannot submit more than 1 comment every 8 seconds (to prevent double-posting.)",
      },
      {
        karmaThreshold: 10,
        timeframeUnit: 'days',
        timeframeLength: 1,
        itemsPerTimeframe: 3,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Low karma users can write up to 3 comments a day."
      }, 
      {
        karmaThreshold: 0,
        timeframeUnit: 'weeks',
        timeframeLength: 1,
        itemsPerTimeframe: 1,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Negative karma users are limited to 1 comment per day."
      }, 
      {
        karmaThreshold: -30,
        timeframeUnit: 'months',
        timeframeLength: 1,
        itemsPerTimeframe: 1,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Users with less than -30 karma users can only comment once per 3 days."
      },
      {
        downvoteRatio: .05,
        timeframeUnit: 'hours',
        timeframeLength: 1,
        itemsPerTimeframe: 1,
        rateLimitType: 'downvoteRatio',
        rateLimitMessage: "Users who've been downvoted significantly can only post 1 comment per hour"
      },
      {
        downvoteRatio: .1,
        timeframeUnit: 'hours',
        timeframeLength: 1,
        itemsPerTimeframe: 1,
        rateLimitType: 'downvoteRatio',
        rateLimitMessage: "Users who've been heavily downvoted can only post 1 comment per day"
      }
    ]
  },
  default: {
    posts: [
      {
        timeframeUnit: 'days',
        timeframeLength: 1,
        itemsPerTimeframe: 5,
        rateLimitType: "universal",
        rateLimitMessage: "Users cannot post more than 5 posts a day"
      }
    ],
    comments: [
      {
        timeframeUnit: 'seconds',
        timeframeLength: 8,
        itemsPerTimeframe: 1,
        rateLimitType: "universal",
        rateLimitMessage: "Users cannot submit more than 1 comment every 8 seconds to prevent double-posting.",
      },
    ]
  }
}

// Post rate limiting
getCollectionHooks("Posts").createValidate.add(async function PostsNewRateLimit (validationErrors, { newDocument: post, currentUser }) {
  if (!post.draft) {
    await enforcePostRateLimit(currentUser!);
  }
  return validationErrors;
});

getCollectionHooks("Posts").updateValidate.add(async function PostsUndraftRateLimit (validationErrors, { oldDocument, newDocument, currentUser }) {
  // Only undrafting is rate limited, not other edits
  if (oldDocument.draft && !newDocument.draft) {
    await enforcePostRateLimit(currentUser!);
  }
  return validationErrors;
});

getCollectionHooks("Comments").createValidate.add(async function CommentsNewRateLimit (validationErrors, { newDocument: comment, currentUser }) {
  if (!currentUser) {
    throw new Error(`Can't comment while logged out.`);
  }
  await enforceCommentRateLimit({user: currentUser, comment});

  return validationErrors;
});

getCollectionHooks("Comments").createAsync.add(async ({document}: {document: DbComment}) => {
  const user = await Users.findOne(document.userId)
  
  if (user) {
    const rateLimit = await rateLimitDateWhenUserNextAbleToComment(user, null)
    // if the user has created a comment that makes them hit the rate limit, record an event
    // (ignore the universal 8 sec rate limit)
    if (rateLimit && rateLimit.rateLimitType !== 'universal') {
      captureEvent("commentRateLimitHit", {
        rateLimitType: rateLimit.rateLimitType,
        userId: document.userId,
        commentId: document._id
      })
    }
  }
})

// Check whether the given user can post a post right now. If they can, does
// nothing; if they would exceed a rate limit, throws an exception.
async function enforcePostRateLimit (user: DbUser) {
  const rateLimit = await rateLimitDateWhenUserNextAbleToPost(user);
  if (rateLimit) {
    const {nextEligible} = rateLimit;
    if (nextEligible > new Date()) {
      // "fromNow" makes for a more human readable "how long till I can comment/post?".
      // moment.relativeTimeThreshold ensures that it doesn't appreviate unhelpfully to "now"
      moment.relativeTimeThreshold('ss', 0);
      throw new Error(`Rate limit: You cannot post for ${moment(nextEligible).fromNow()}, until ${nextEligible}`);
    }
  }
}

async function enforceCommentRateLimit({user, comment}:{user: DbUser, comment: DbComment}) {
  const rateLimit = await rateLimitDateWhenUserNextAbleToComment(user, comment.postId);
  if (rateLimit) {
    const {nextEligible, rateLimitType:_} = rateLimit;
    if (nextEligible > new Date()) {
      // "fromNow" makes for a more human readable "how long till I can comment/post?".
      // moment.relativeTimeThreshold ensures that it doesn't appreviate unhelpfully to "now"
      moment.relativeTimeThreshold('ss', 0);
      throw new Error(`Rate limit: You cannot comment for ${moment(nextEligible).fromNow()} (until ${nextEligible})`);
    }
  }
}


export async function rateLimitDateWhenUserNextAbleToPost(user: DbUser): Promise<RateLimitInfo|null> {
  // Admins and Sunshines aren't rate-limited
  if (shouldIgnorePostRateLimit(user)) return null;
  
  // does the user have a moderator-assigned rate limit?
  const modRateLimitHours = await getModRateLimitHours(user._id);

  // what's the longest rate limit timeframe being evaluated?
  const maxPostAutolimitHours = getMaxAutoLimitHours(forumSelect(autoRateLimits).posts)
  console.log({maxPostAutolimitHours})
  const maxHours = Math.max(modRateLimitHours, maxPostAutolimitHours);
  console.log({maxHours})

  // fetch the posts from within the maxTimeframe
  const postsInTimeframe = await getPostsInTimeframe(user, maxHours);

  return getStrictestPostRateLimitInfo(user, postsInTimeframe, modRateLimitHours);
}

export async function rateLimitDateWhenUserNextAbleToComment(user: DbUser, postId: string | null): Promise<RateLimitInfo|null> {
  const ignoreRateLimits = await shouldIgnoreCommentRateLimit(user, postId);
  if (ignoreRateLimits) return null;

  // does the user have a moderator-assigned rate limit?
  const [modRateLimitHours, modPostSpecificRateLimitHours] = await Promise.all([
    getModRateLimitHours(user._id),
    getModPostSpecificRateLimitHours(user._id)
  ]);

  // what's the longest rate limit timeframe being evaluated?
  const highestStandardRateCommentLimitHours = 24;
  const maxHours = Math.max(modRateLimitHours, modPostSpecificRateLimitHours, highestStandardRateCommentLimitHours);

  // fetch the comments from within the maxTimeframe
  const commentsInTimeframe = await getCommentsInInterval(user._id, maxHours);

  return await getStrictestCommentRateLimitInfo({
    commentsInTimeframe: commentsInTimeframe, 
    user, 
    modRateLimitHours, 
    modPostSpecificRateLimitHours, 
    postId
  });
}

function getStrictestRateLimitInfo (rateLimits: Array<RateLimitInfo|null>): RateLimitInfo | null {
  return rateLimits.reduce((prev, current) => {
    if (!current) return prev
    if (!prev) return current
    return prev.nextEligible < current.nextEligible ? prev : current
  }, null)
}

function getStrictestPostRateLimitInfo(user: DbUser, postsInTimeframe: Array<DbPost>, modRateLimitHours: number): RateLimitInfo|null {
  // for each rate limit, get the next date that user could post  
  const modRateLimitInfo = getModRateLimitInfo(postsInTimeframe, modRateLimitHours)
  const autoRatelimits = forumSelect(autoRateLimits).posts

  const autoRateLimitInfos = autoRatelimits ? autoRatelimits?.map(
    rateLimit => getAutoRateLimitInfo(user, rateLimit, postsInTimeframe)
  ) : []

  const rateLimitInfos = [modRateLimitInfo, ...autoRateLimitInfos]

  return getStrictestRateLimitInfo(rateLimitInfos)
}

interface StrictestCommentRateLimitInfoParams {
  commentsInTimeframe: Array<DbComment>,
  user: DbUser,
  modRateLimitHours: number,
  modPostSpecificRateLimitHours: number,
  postId: string | null
}

async function getModPostSpecificRateLimitInfo (userId: string, comments: Array<DbComment>, modPostSpecificRateLimitHours: number, postId: string | null): Promise<RateLimitInfo|null> {
  const eligibleForCommentOnSpecificPostRateLimit = modPostSpecificRateLimitHours > 0 && (await shouldApplyModRateLimitForPost(userId, postId));
  const commentsOnPost = comments.filter(comment => comment.postId === postId)

  return eligibleForCommentOnSpecificPostRateLimit ? getModRateLimitInfo(commentsOnPost, modPostSpecificRateLimitHours) : null
}

async function getStrictestCommentRateLimitInfo({commentsInTimeframe, user, modRateLimitHours, modPostSpecificRateLimitHours, postId}: StrictestCommentRateLimitInfoParams): Promise<RateLimitInfo|null> {
  const commentsOnOthersPostsInInterval =  await getCommentsOnOthersPosts(commentsInTimeframe, user._id)
  const modGeneralRateLimitInfo = getModRateLimitInfo(commentsOnOthersPostsInInterval, modRateLimitHours)

  const modSpecificPostRateLimitInfo = await getModPostSpecificRateLimitInfo(user._id, commentsOnOthersPostsInInterval, modPostSpecificRateLimitHours, postId)

  const autoRatelimits = forumSelect(autoRateLimits).comments
  const autoRateLimitInfos = autoRatelimits ? autoRatelimits?.map(
    rateLimit => getAutoRateLimitInfo(user, rateLimit, commentsInTimeframe)
  ) : []

  const rateLimitInfos = [modGeneralRateLimitInfo, modSpecificPostRateLimitInfo, ...autoRateLimitInfos]
  return getStrictestRateLimitInfo(rateLimitInfos)
}

async function getCommentsInInterval (userId: string, maxTimeframe: number) {
  const commentsInTimeframe = await Comments.find(
    { userId: userId, 
      postedAt: {$gte: moment().subtract(maxTimeframe, 'hours').toDate()}
    }, {
      sort: {postedAt: -1}, 
      projection: {postId: 1, postedAt: 1}
    }
  ).fetch()
  return commentsInTimeframe
}

async function getCommentsOnOthersPosts(comments: Array<DbComment>, userId: string) {
  const postIds = comments.map(comment => comment.postId)
  const postsNotAuthoredByCommenter = await Posts.find(
    { _id: {$in: postIds}, userId: {$ne: userId}}, {projection: {_id:1, coauthorStatuses:1}
  }).fetch()
  // right now, filtering out coauthors doesn't work (due to a bug in our query builder), so we're doing that manually
  const postsNotCoauthoredByCommenter = postsNotAuthoredByCommenter.filter(post => !post.coauthorStatuses || post.coauthorStatuses.every(coauthorStatus => coauthorStatus.userId !== userId))
  const postsNotAuthoredByCommenterIds = postsNotCoauthoredByCommenter.map(post => post._id)
  const commentsOnNonauthorPosts = comments.filter(comment => postsNotAuthoredByCommenterIds.includes(comment.postId))
  return commentsOnNonauthorPosts
}

/**
 * Checks if the user is exempt from commenting rate limits (optionally, for the given post).
 *
 * Admins and mods are always exempt.
 * If the post has "ignoreRateLimits" set, then all users are exempt.
 * On forums other than the EA Forum, the post author is always exempt on their own posts.
 */
async function shouldIgnoreCommentRateLimit(user: DbUser, postId: string | null): Promise<boolean> {
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment")) {
    return true;
  }
  if (postId) {
    const post = await Posts.findOne({_id: postId}, undefined, { userId: 1, ignoreRateLimits: 1 });
    if (post?.ignoreRateLimits) {
      return true;
    }
  }
  return false;
}

function getNextAbleToSubmitDate(documents: Array<DbPost|DbComment>, intervalUnit:  IntervalUnitType, intervalLength: number, itemsPerInterval:number): Date|null {
  // make sure documents are sorted by descending date
  const sortedDocs = documents.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
  const docsInInterval = sortedDocs.filter(doc => doc.postedAt > moment().subtract(intervalLength, intervalUnit).toDate())
  const doc = docsInInterval[itemsPerInterval - 1]
  if (!doc) return null 
  return moment(doc.postedAt).add(intervalLength, intervalUnit).toDate()
}

function shouldIgnorePostRateLimit(user: DbUser) {
  return userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment") || userIsMemberOf(user, "canBypassPostRateLimit")
}

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
    postedAt: {$gte: moment().subtract(maxHours, 'hours').toDate()}
  }, {sort: {postedAt: -1}, projection: {postedAt: 1}}).fetch()
}

/**
 * Check if the user has a commenting rate limit due to having a high % of their received votes be downvotes.
 */
 function shouldDownvoteRatioCommentRateLimit(user: DbUser, ratioThreshold: number): boolean {
  // First check if the sum of the individual vote count fields
  // add up to something close (with 5%) to the voteReceivedCount field.
  // (They should be equal, but we know there are bugs around counting votes,
  // so to be fair to users we don't want to rate limit them if it's too buggy.)
  const sumOfVoteCounts = user.smallUpvoteReceivedCount + user.bigUpvoteReceivedCount + user.smallDownvoteReceivedCount + user.bigDownvoteReceivedCount;
  const denormalizedVoteCountSumDiff = Math.abs(sumOfVoteCounts - user.voteReceivedCount);
  const voteCountsAreValid = user.voteReceivedCount > 0
    && (denormalizedVoteCountSumDiff / user.voteReceivedCount) <= 0.05;
  
  const totalDownvoteCount = user.smallDownvoteReceivedCount + user.bigDownvoteReceivedCount;
  // If vote counts are not valid (i.e. they are negative or voteReceivedCount is 0), then do nothing
  const downvoteRatio = voteCountsAreValid ? (totalDownvoteCount / user.voteReceivedCount) : 0

  return downvoteRatio > ratioThreshold
}

function getModRateLimitInfo (documents: Array<DbPost|DbComment>, modRateLimitHours: number): RateLimitInfo|null {
  if (modRateLimitHours <= 0) return null
  const nextEligible = getNextAbleToSubmitDate(documents, "hours", modRateLimitHours, 1)
  if (!nextEligible) return null
  return {
    nextEligible,
    rateLimitMessage: "A moderator has rate limited you",
    rateLimitType: "moderator"
  }
}

function getAutoRateLimitInfo (user: DbUser, rateLimit: AutoRateLimit, documents: Array<DbPost|DbComment>): RateLimitInfo|null {
  const { karmaThreshold, downvoteRatio, timeframeUnit: intervalUnit, timeframeLength: intervalLength, itemsPerTimeframe: itemsPerInterval, rateLimitMessage, rateLimitType } = rateLimit

  if (karmaThreshold && karmaThreshold < user.karma) return null 
  if (downvoteRatio && !shouldDownvoteRatioCommentRateLimit(user, downvoteRatio)) return null
  const nextEligible = getNextAbleToSubmitDate(documents, intervalUnit, intervalLength, itemsPerInterval)
  if (!nextEligible) return null 
  return { nextEligible, rateLimitType, rateLimitMessage}
}

async function shouldApplyModRateLimitForPost(userId: string, postId: string|null): Promise<boolean> {
  if (!postId) return false
  const post = await Posts.findOne({_id:postId}, {projection:{userId:1, coauthorStatuses:1}})
  if (!post) return false
  const userIsNotPrimaryAuthor = post.userId !== userId
  const userIsNotCoauthor = !post.coauthorStatuses || post.coauthorStatuses.every(coauthorStatus => coauthorStatus.userId !== userId)
  return userIsNotPrimaryAuthor && userIsNotCoauthor
}

async function getModLimitNextCommentOnPostDate(userId: string, comments: Array<DbComment>, modPostSpecificRateLimitHours: number, postId: string|null) {
  const eligibleForCommentOnSpecificPostRateLimit = (modPostSpecificRateLimitHours > 0 && await shouldApplyModRateLimitForPost(userId, postId));
  const commentsOnSpecificPostInTimeframe = comments.filter(comment => postId && comment.postId === postId);
  if (!eligibleForCommentOnSpecificPostRateLimit) return null
  return getNextAbleToSubmitDate(commentsOnSpecificPostInTimeframe, "hours", modPostSpecificRateLimitHours, 3)
}

async function modLimitNextCommentRateLimitInfo(comments: Array<DbComment>, user: DbUser, modRateLimitHours: number, postId: string|null): Promise<RateLimitInfo|null> {
  if (modRateLimitHours <= 0 || !(await shouldApplyModRateLimitForPost(user._id, postId))) return null
  getNextAbleToSubmitDate(comments, "hours", modRateLimitHours, 1)

  return null
}

function getMaxAutoLimitHours (rateLimits?: Array<AutoRateLimit>) {
  if (!rateLimits) return 0
  return Math.max(...rateLimits.map(({timeframeLength: intervalLength,timeframeUnit: intervalUnit}) => {
    return moment.duration(intervalLength, intervalUnit).asHours()
  }))
}
