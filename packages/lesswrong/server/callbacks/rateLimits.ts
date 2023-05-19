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


const postIntervalSetting = new DatabasePublicSetting<number>('forum.postInterval', 30) // How long users should wait between each posts, in seconds
const maxPostsPer24Hours = new DatabasePublicSetting<number>('forum.maxPostsPerDay', 5) // Maximum number of posts a user can create in a day

// karma threshold info
// Rate limit the number of comments a user can post per interval if they have under this much karma


interface AutoRateLimitBase {
  intervalUnit: 'weeks'|'days'|'hours'|'minutes',
  intervalLength: number,
  actionsPerInterval: number,
  analyticsCategory?: RateLimitType 
}

interface KarmaThresholdRateLimit extends AutoRateLimitBase {
  karmaThreshold: number, // users with karma less than this are affected by the rateLimit
}

interface DownvoteRatioRateLimit extends AutoRateLimitBase {
  downvoteRatio: number, // users will be rate limited if their ratio of received downvotes  / total votes is higher than this
}

// eaforum look here – I refactored how karma threshold rate limits worked so LW could have multiple thresholds. 
// I set the default to use (from what I recall) your current settings so you shouldn't _need_ to do anything but 
// you probably will want to clean up your database settings
const defaultKarmaThresholdRateLimit = {
  karmaThreshold: 30,
  intervalUnit: 'minutes',
  intervalLength: 30,
  actionsPerInterval: 4,
  analyticsCategory: "lowKarma"
} as const;

const defaultDownvoteRatioRateLimit = {
  downvoteRatio: .3,
  intervalUnit: 'minutes',
  intervalLength: 30,
  actionsPerInterval: 4,
  analyticsCategory: "lowKarma"
} as const

const postKarmaThresholdRateLimits = new DatabasePublicSetting<Array<KarmaThresholdRateLimit>>('postKarmaThresholdRateLimits', [])
const commentKarmaThresholdRateLimits = new DatabasePublicSetting<Array<KarmaThresholdRateLimit>>('commentKarmaThresholdRateLimits', [defaultKarmaThresholdRateLimit])

const commentDownvoteRatioRateLimits = new DatabasePublicSetting<Array<DownvoteRatioRateLimit>>('commentDownvoteRatioRateLimits', [defaultDownvoteRatioRateLimit])

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

const commentIntervalSetting = new DatabasePublicSetting<number>('commentInterval', 8) // How long users should wait in between comments (in seconds)
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

function getNextAbleToSubmitDate(documents: Array<DbPost|DbComment>, intervalType:  "seconds"|"hours", intervalLength: number, itemsPerInterval:number): Date|null {
  // make sure documents are sorted by descending date
  const sortedDocs = documents.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
  const docsInInterval = sortedDocs.filter(doc => doc.postedAt > moment().subtract(intervalLength, intervalType).toDate())
  const doc = docsInInterval[itemsPerInterval - 1]
  if (!doc) return null 
  return moment(doc.postedAt).add(intervalLength, intervalType).toDate()
}

export type RateLimitType = "moderator"|"lowKarma"|"universal"|"downvoteRatio"

export type RateLimitInfo = {
  nextEligible: Date,
  rateLimitType: RateLimitType,
  rateLimitMessage: string,
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

function isStrictestRateLimit(rateLimitDate: Date | null, allPossibleDates: Array<Date | null>): rateLimitDate is Date {
  return !!rateLimitDate && allPossibleDates.every(date => rateLimitDate >= (date ?? new Date()));
}

function getPostLowKarmaNextPostDate(user: DbUser, posts: Array<DbPost>) {
  const karmaThreshold = postLimitLowKarmaThreshold.get()
  const intervalLength = postLimitLowKarmaIntervalHours.get()
  const postsInInterval = postLimitLowKarmaNumComments.get()
  if (!karmaThreshold) return null 
  if (user.karma > karmaThreshold) return null 
  return getNextAbleToSubmitDate(posts, "hours", intervalLength, postsInInterval)
}

function getPostVeryLowKarmaNextPostDate(user: DbUser, posts: Array<DbPost>) {
  const karmaThreshold = postLimitVeryLowKarmaThreshold.get()
  const intervalLength = postLimitVeryLowKarmaIntervalHours.get()
  const postsInInterval = postLimitVeryLowKarmaNumComments.get()
  if (!karmaThreshold) return null 
  if (user.karma > karmaThreshold) return null 
  return getNextAbleToSubmitDate(posts, "hours", intervalLength, postsInInterval)
}

const postLimitLowKarmaThreshold = new DatabasePublicSetting<number|null>('postLimitLowKarmaThreshold', null) // LW uses "10"
const postLimitLowKarmaNumComments = new DatabasePublicSetting<number>('postLimitLowKarmaNumComments', 1)
const postLimitLowKarmaIntervalHours = new DatabasePublicSetting<number>('postLimitLowKarmaIntervalHours', 3 * 24)

const postLimitVeryLowKarmaThreshold = new DatabasePublicSetting<number|null>('postLimitVeryLowKarmaThreshold', null) // LW uses "-1"
const postLimitVeryLowKarmaNumComments = new DatabasePublicSetting<number>('postLimitVeryLowKarmaNumComments', 1)
const postLimitVeryLowKarmaIntervalHours = new DatabasePublicSetting<number>('postLimitVeryLowKarmaIntervalHours', 7 * 24)

const postLimitSuperLowKarmaThreshold = new DatabasePublicSetting<number|null>('postLimitSuperLowKarmaThreshold', null) // LW uses "-30"
const postLimitSuperLowKarmaNumComments = new DatabasePublicSetting<number>('postLimitSuperLowKarmaNumComments', 1)
const postLimitSuperLowKarmaIntervalHours = new DatabasePublicSetting<number>('postLimitSuperLowKarmaIntervalHours', 30 * 24)

function getStrictestPostRateLimitInfo(postsInTimeframe: Array<DbPost>, modRateLimitHours: number): RateLimitInfo|null {
  // for each rate limit, get the next date that user could post
  const modLimitNextPostDate = (modRateLimitHours > 0) ? getNextAbleToSubmitDate(postsInTimeframe, "hours", modRateLimitHours, 1) : null
  const dailyLimitNextPostDate = getNextAbleToSubmitDate(postsInTimeframe, "hours", 24, maxPostsPer24Hours.get())
  const doublePostLimitNextPostDate = getNextAbleToSubmitDate(postsInTimeframe, "seconds", postIntervalSetting.get(), 1)
  const lowKarmaPostDate = getPostLowKarmaNextPostDate(user, postsInTimeframe)

  const nextAbleToPostDates = [modLimitNextPostDate, dailyLimitNextPostDate, doublePostLimitNextPostDate]

  if (isStrictestRateLimit(modLimitNextPostDate, nextAbleToPostDates)) {
    return {
      nextEligible: modLimitNextPostDate,
      rateLimitMessage: "A moderator has rate limited you.",
      rateLimitType: "moderator"
    }
  }

  if (isStrictestRateLimit(dailyLimitNextPostDate, nextAbleToPostDates)) {
    return {
      nextEligible: dailyLimitNextPostDate,
      rateLimitMessage: `Users cannot submit more than ${maxPostsPer24Hours.get()} per day.`,
      rateLimitType: "universal"
    }
  }

  if (isStrictestRateLimit(doublePostLimitNextPostDate, nextAbleToPostDates)) {
    return {
      nextEligible: doublePostLimitNextPostDate,
      rateLimitMessage: `Users cannot submit more than 1 post per ${postIntervalSetting.get()} seconds.`,
      rateLimitType: "universal"
    }
  }
  return null
}

async function applyModRateLimitForPost(userId: string, postId: string|null): Promise<boolean> {
  if (!postId) return false
  const post = await Posts.findOne({_id:postId}, {projection:{userId:1, coauthorStatuses:1}})
  if (!post) return false
  const userIsNotPrimaryAuthor = post.userId !== userId
  const userIsNotCoauthor = !post.coauthorStatuses || post.coauthorStatuses.every(coauthorStatus => coauthorStatus.userId !== userId)
  return userIsNotPrimaryAuthor && userIsNotCoauthor
}

async function getModLimitNextCommentOnPostDate(userId: string, comments: Array<DbComment>, modPostSpecificRateLimitHours: number, postId: string|null) {
  const eligibleForCommentOnSpecificPostRateLimit = (modPostSpecificRateLimitHours > 0 && await applyModRateLimitForPost(userId, postId));
  const commentsOnSpecificPostInTimeframe = comments.filter(comment => postId && comment.postId === postId);
  if (!eligibleForCommentOnSpecificPostRateLimit) return null
  return getNextAbleToSubmitDate(commentsOnSpecificPostInTimeframe, "hours", modPostSpecificRateLimitHours, 3)
}

function getLowKarmaNextCommentDate(user: DbUser, comments: Array<DbComment>) {
  const hasLowKarmaRateLimit = checkLowKarmaCommentRateLimit(user);
  const intervalLength = commentLimitLowKarmaIntervalHours.get()
  const numberOfComments = commentLimitLowKarmaNumComments.get()
  if (!hasLowKarmaRateLimit) return null
  return getNextAbleToSubmitDate(comments, "hours", intervalLength, numberOfComments)
}

function getHighDownvoteRatioNextCommentDate(user: DbUser, comments: Array<DbComment>) {
  const hasDownvoteRatioRateLimit = checkDownvoteRatioCommentRateLimit(user);
  return hasDownvoteRatioRateLimit
    ? getNextAbleToSubmitDate(comments, "hours", .5, 4)
    : null
}
interface StrictestCommentRateLimitInfoParams {
  commentsInTimeframe: Array<DbComment>,
  user: DbUser,
  modRateLimitHours: number,
  modPostSpecificRateLimitHours: number,
  postId: string | null
}

async function getStrictestCommentRateLimitInfo({commentsInTimeframe, user, modRateLimitHours, modPostSpecificRateLimitHours, postId}: StrictestCommentRateLimitInfoParams): Promise<RateLimitInfo|null> {
  /**
   * Because we ignore rate limits when a user is commenting on their own post (excepting the EA forum),
   * we want to filter out the comments a user made on their own post when evaluating a rate limit
   * for comments made on others' posts.
   */
  const commentsOnOthersPostsInTimeframe =  await getCommentsOnOthersPosts(commentsInTimeframe, user._id)

  const modLimitNextCommentDate = (modRateLimitHours > 0 && await applyModRateLimitForPost(user._id, postId))
    ? getNextAbleToSubmitDate(commentsOnOthersPostsInTimeframe, "hours", modRateLimitHours, 1)
    : null

  const modLimitNextCommentOnPostDate = await getModLimitNextCommentOnPostDate(
    user._id, commentsOnOthersPostsInTimeframe, modPostSpecificRateLimitHours, postId) 

  const lowKarmaNextCommentDate = getLowKarmaNextCommentDate(user, commentsInTimeframe)
  const highDownvoteRatioNextCommentDate = getHighDownvoteRatioNextCommentDate(user, commentsInTimeframe)

  const doubleCommentLimitNextCommentDate = getNextAbleToSubmitDate(commentsInTimeframe, "seconds", commentIntervalSetting.get(), 1);
  
  const nextAbleToCommentDates: Array<Date | null> = [
    modLimitNextCommentDate,
    modLimitNextCommentOnPostDate,
    lowKarmaNextCommentDate,
    highDownvoteRatioNextCommentDate,
    doubleCommentLimitNextCommentDate
  ];

  if (isStrictestRateLimit(modLimitNextCommentDate, nextAbleToCommentDates)) {
    return {
      nextEligible: modLimitNextCommentDate,
      rateLimitMessage: "A moderator has rate limited you.",
      rateLimitType: "moderator"
    };
  }

  if (isStrictestRateLimit(modLimitNextCommentOnPostDate, nextAbleToCommentDates)) {
    return {
      nextEligible: modLimitNextCommentOnPostDate,
      rateLimitMessage: "A moderator has rate limited you.",
      rateLimitType: "moderator"
    };
  }

  if (isStrictestRateLimit(lowKarmaNextCommentDate, nextAbleToCommentDates)) {
    return {
      nextEligible: lowKarmaNextCommentDate,
      rateLimitMessage: "You'll be able to post more comments as your karma increases.",
      rateLimitType: "lowKarma"
    };
  }

  if (isStrictestRateLimit(highDownvoteRatioNextCommentDate, nextAbleToCommentDates)) {
    return {
      nextEligible: highDownvoteRatioNextCommentDate,
      rateLimitMessage: "",
      rateLimitType: "downvoteRatio"
    };
  }

  if (isStrictestRateLimit(doubleCommentLimitNextCommentDate, nextAbleToCommentDates)) {
    return {
      nextEligible: doubleCommentLimitNextCommentDate,
      rateLimitMessage: `Users cannot submit more than 1 comment every ${commentIntervalSetting.get()} seconds to prevent double-commenting.`,
      rateLimitType: "universal"
    };
  }

  return null;
}

export async function rateLimitDateWhenUserNextAbleToPost(user: DbUser): Promise<RateLimitInfo|null> {
  // Admins and Sunshines aren't rate-limited
  if (shouldIgnorePostRateLimit(user)) return null;
  
  // does the user have a moderator-assigned rate limit?
  const modRateLimitHours = await getModRateLimitHours(user._id);

  // what's the longest rate limit timeframe being evaluated?
  const highestStandardPostRateLimitHours = 24;
  const maxHours = Math.max(modRateLimitHours, highestStandardPostRateLimitHours);

  // fetch the posts from within the maxTimeframe
  const postsInTimeframe = await getPostsInTimeframe(user, maxHours);

  return getStrictestPostRateLimitInfo(postsInTimeframe, modRateLimitHours);
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
  const commentsInTimeframe = await getCommentsInTimeframe(user._id, maxHours);

  return await getStrictestCommentRateLimitInfo({
    commentsInTimeframe, 
    user, 
    modRateLimitHours, 
    modPostSpecificRateLimitHours, 
    postId
  });
}

/**
 * Check if the user has a commenting rate limit due to having low karma.
 */
function checkLowKarmaCommentRateLimit(user: DbUser): boolean {
  const karmaThreshold = commentLimitLowKarmaThreshold.get();
  return karmaThreshold !== null && user.karma < karmaThreshold;
}

/**
 * Check if the user has a commenting rate limit due to having a high % of their received votes be downvotes.
 */
function checkDownvoteRatioCommentRateLimit(user: DbUser): boolean {
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
  const downvoteRatioThreshold = commentLimitDownvoteRatio.get()
  const aboveDownvoteRatioThreshold = downvoteRatioThreshold !== null && downvoteRatio > downvoteRatioThreshold

  return aboveDownvoteRatioThreshold
}
