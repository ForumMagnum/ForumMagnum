import { Posts } from '../../lib/collections/posts'
import { userIsAdmin, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { getCollectionHooks } from '../mutationCallbacks';
import Comments from '../../lib/collections/comments/collection';
import { RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK } from '../../lib/collections/moderatorActions/schema';
import { getModeratorRateLimit, getTimeframeForRateLimit, userHasActiveModeratorActionOfType } from '../../lib/collections/moderatorActions/helpers';
import moment from 'moment';
import Users from '../../lib/collections/users/collection';
import { captureEvent } from '../../lib/analyticsEvents';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

type TimeframeUnitType = 'seconds'|'minutes'|'hours'|'days'|'weeks'|'months'
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

AutoRateLimits check how documents the user has posted in a recent timeframe interval, and prevents them
from posting more if they've posted more than the alloted number of itemsPerTimeframe.

AutoRateLimits can take in an optional karmaThreshold or downvoteRatio parameter. If set, the AutoRateLimit
applies to users who meet that karmaThreshold and/or downvoteRatio criteria. If both params are set, the 
rate limit only applies if both conditions are met. If neither param is set, the rate limit applies to all users.
*/
interface AutoRateLimit <T extends "Posts"|"Comments"> {
  actionType: T, // which collection the rate limit applies to
  karmaThreshold?: number, // if set, the rate limit will only apply to users with karma less than the threshold
  downvoteRatio?: number, // if set, the rate limit will only apply to users who's ratio of received downvotes / total votes is higher than the listed threshold
  timeframeLength: number, // how long the time timeframe is (measured in the timeframeUnit, below)
  timeframeUnit: TimeframeUnitType, // measuring units for the timeframe (i.e. minutes, hours, days)
  itemsPerTimeframe: number, // number of items a user can post/comment/etc before triggering rate limit
  rateLimitType: RateLimitType // short name used in analytics db
  rateLimitMessage: string // A message displayed to users when they are rate limited
}



type ForumAutoRateLimits = {
  posts?: Array<AutoRateLimit<"Posts">>,
  comments?: Array<AutoRateLimit<"Comments">>
}

// eaforum look here
// Rate limits for each forum
const autoRateLimits: ForumOptions<ForumAutoRateLimits> = {
  EAForum: {
    posts: [
      {
        actionType: "Posts",
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
        actionType: "Comments",
        timeframeUnit: 'seconds',
        timeframeLength: 8,
        itemsPerTimeframe: 1,
        rateLimitType: "universal",
        rateLimitMessage: "Users cannot submit more than 1 comment every 8 seconds to prevent double-posting.",
      },
      {
        actionType: "Comments",
        karmaThreshold: 30,
        timeframeUnit: 'minutes',
        timeframeLength: 30,
        itemsPerTimeframe: 4,
        rateLimitType: "lowKarma",
        rateLimitMessage: "You'll be able to post more comments as your karma increases"
      },
      {
        actionType: "Comments",
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
        actionType: "Posts",
        karmaThreshold: 500,
        timeframeUnit: 'days',
        timeframeLength: 1,
        itemsPerTimeframe: 5,
        rateLimitType: "universal",
        rateLimitMessage: "Users with less than 500 karma cannot post more than 5 posts a day"
      },
      {
        actionType: "Posts",
        karmaThreshold: 10,
        timeframeUnit: 'weeks',
        timeframeLength: 1,
        itemsPerTimeframe: 2,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "As you gain more karma you'll be able to post more frequently."
      }, 
      {
        actionType: "Posts",
        karmaThreshold: 0,
        timeframeUnit: 'weeks',
        timeframeLength: 1,
        itemsPerTimeframe: 1,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Negative karma users are limited to 1 post per week."
      }, 
      {
        actionType: "Posts",
        karmaThreshold: -30,
        timeframeUnit: 'weeks',
        timeframeLength: 2,
        itemsPerTimeframe: 1,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Users with less than -30 karma users can only post once every two weeks."
      },
    ],
    comments: [
      {
        actionType: "Comments",
        timeframeUnit: 'seconds',
        timeframeLength: 8,
        itemsPerTimeframe: 1,
        rateLimitType: "universal",
        rateLimitMessage: "Users cannot submit more than 1 comment every 8 seconds (to prevent double-posting.)",
      },
      {
        actionType: "Comments",
        karmaThreshold: 5,
        timeframeUnit: 'days',
        timeframeLength: 1,
        itemsPerTimeframe: 3,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "New users can write up to 3 comments a day. Gain more karma to comment more frequently."
      }, 
      {
        actionType: "Comments",
        karmaThreshold: -1,
        timeframeUnit: 'days',
        timeframeLength: 1,
        itemsPerTimeframe: 1,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Negative karma users are limited to 1 comment per day."
      }, 
      {
        actionType: "Comments",
        karmaThreshold: -15,
        timeframeUnit: 'days',
        timeframeLength: 3,
        itemsPerTimeframe: 1,
        rateLimitType: 'lowKarma',
        rateLimitMessage: "Users with -15 or less karma users can only comment once per 3 days."
      }
    ]
  },
  default: {
    posts: [
      {
        actionType: "Posts",
        timeframeUnit: 'days',
        timeframeLength: 1,
        itemsPerTimeframe: 5,
        rateLimitType: "universal",
        rateLimitMessage: "Users cannot post more than 5 posts a day"
      }
    ],
    comments: [
      {
        actionType: "Comments",
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


export async function rateLimitDateWhenUserNextAbleToPost(user: DbUser): Promise<RateLimitInfo|null> {
  // Admins and Sunshines aren't rate-limited
  if (shouldIgnorePostRateLimit(user)) return null;
  
  // does the user have a moderator-assigned rate limit?
  const modRateLimitHours = await getModRateLimitHours(user._id);

  // what's the longest rate limit timeframe being evaluated?
  const maxPostAutolimitHours = getMaxAutoLimitHours(forumSelect(autoRateLimits).posts)
  const maxHours = Math.max(modRateLimitHours, maxPostAutolimitHours);

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
  const maxCommentAutolimitHours = getMaxAutoLimitHours(forumSelect(autoRateLimits).comments)
  const maxHours = Math.max(modRateLimitHours, modPostSpecificRateLimitHours, maxCommentAutolimitHours);
  // fetch the comments from within the maxTimeframe
  const commentsInTimeframe = await getCommentsInTimeframe(user._id, maxHours);

  return await getStrictestCommentRateLimitInfo({
    commentsInTimeframe, 
    user, 
    modRateLimitHours, 
    modPostSpecificRateLimitHours, 
    postId
  });
}

function getStrictestRateLimitInfo (rateLimits: Array<RateLimitInfo|null>): RateLimitInfo | null {
  const nonNullRateLimits = rateLimits.filter((rateLimit): rateLimit is RateLimitInfo => rateLimit !== null)
  const sortedRateLimits = nonNullRateLimits.sort((a, b) => {
    if (a.nextEligible < b.nextEligible) return 1;
    if (a.nextEligible > b.nextEligible) return -1;
    return 0;
  });
  return sortedRateLimits[0] || null;
}

function getStrictestPostRateLimitInfo(user: DbUser, postsInTimeframe: Array<DbPost>, modRateLimitHours: number): RateLimitInfo|null {
  // for each rate limit, get the next date that user could post  
  const modRateLimitInfo = getModRateLimitInfo(postsInTimeframe, modRateLimitHours, 1)
  const autoRatelimits = forumSelect(autoRateLimits).posts

  const autoRateLimitInfos = autoRatelimits?.map(
    rateLimit => getAutoRateLimitInfo(user, rateLimit, postsInTimeframe)
  ) ?? []

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

  return eligibleForCommentOnSpecificPostRateLimit ? getModRateLimitInfo(commentsOnPost, modPostSpecificRateLimitHours, 3) : null
}

async function getStrictestCommentRateLimitInfo({commentsInTimeframe, user, modRateLimitHours, modPostSpecificRateLimitHours, postId}: StrictestCommentRateLimitInfoParams): Promise<RateLimitInfo|null> {
  const commentsOnOthersPostsInTimeframe =  await getCommentsOnOthersPosts(commentsInTimeframe, user._id)
  const modGeneralRateLimitInfo = getModRateLimitInfo(commentsOnOthersPostsInTimeframe, modRateLimitHours, 1)

  const modSpecificPostRateLimitInfo = await getModPostSpecificRateLimitInfo(user._id, commentsOnOthersPostsInTimeframe, modPostSpecificRateLimitHours, postId)

  const autoRatelimits = forumSelect(autoRateLimits).comments
  const autoRateLimitInfos = autoRatelimits?.map(
    rateLimit => getAutoRateLimitInfo(user, rateLimit, commentsInTimeframe)
  ) ?? []

  const rateLimitInfos = [modGeneralRateLimitInfo, modSpecificPostRateLimitInfo, ...autoRateLimitInfos]

  const result = getStrictestRateLimitInfo(rateLimitInfos)
  return result
}

async function getCommentsInTimeframe (userId: string, maxTimeframe: number) {
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

function getNextAbleToSubmitDate(documents: Array<DbPost|DbComment>, timeframeUnit:  TimeframeUnitType, timeframeLength: number, itemsPerTimeframe:number): Date|null {
  // make sure documents are sorted by descending date
  const sortedDocs = documents.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
  const docsInTimeframe = sortedDocs.filter(doc => doc.postedAt > moment().subtract(timeframeLength, timeframeUnit).toDate())
  const doc = docsInTimeframe[itemsPerTimeframe - 1]
  if (!doc) return null 
  return moment(doc.postedAt).add(timeframeLength, timeframeUnit).toDate()
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

export function getDownvoteRatio(user: DbUser|SunshineUsersList): number {
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

  return downvoteRatio
}

function getModRateLimitInfo (documents: Array<DbPost|DbComment>, modRateLimitHours: number, itemsPerTimeframe: number): RateLimitInfo|null {
  if (modRateLimitHours <= 0) return null
  const nextEligible = getNextAbleToSubmitDate(documents, "hours", modRateLimitHours, itemsPerTimeframe)
  if (!nextEligible) return null
  return {
    nextEligible,
    rateLimitMessage: "A moderator has rate limited you",
    rateLimitType: "moderator"
  }
}

function getAutoRateLimitInfo (user: DbUser, rateLimit: AutoRateLimit, documents: Array<DbPost|DbComment>): RateLimitInfo|null {
  const { karmaThreshold, downvoteRatio, timeframeUnit, timeframeLength, itemsPerTimeframe, rateLimitMessage, rateLimitType } = rateLimit

  if (karmaThreshold && karmaThreshold < user.karma) return null 
  if (downvoteRatio && getDownvoteRatio(user) < downvoteRatio) return null
  const nextEligible = getNextAbleToSubmitDate(documents, timeframeUnit, timeframeLength, itemsPerTimeframe)
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

function getMaxAutoLimitHours (rateLimits?: Array<AutoRateLimit>) {
  if (!rateLimits) return 0
  return Math.max(...rateLimits.map(({timeframeLength, timeframeUnit}) => {
    return moment.duration(timeframeLength, timeframeUnit).asHours()
  }))
}
