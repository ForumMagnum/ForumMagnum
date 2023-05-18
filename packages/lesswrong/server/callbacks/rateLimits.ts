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
import { isEAForum } from '../../lib/instanceSettings';


const postIntervalSetting = new DatabasePublicSetting<number>('forum.postInterval', 30) // How long users should wait between each posts, in seconds
const maxPostsPer24HoursSetting = new DatabasePublicSetting<number>('forum.maxPostsPerDay', 5) // Maximum number of posts a user can create in a day

// Rate limit the number of comments a user can post per 30 min if they have under this much karma
const commentRateLimitKarmaThresholdSetting = new DatabasePublicSetting<number|null>('commentRateLimitKarmaThreshold', null)
// Rate limit the number of comments a user can post per 30 min if their ratio of downvotes received : total votes received is higher than this
const commentRateLimitDownvoteRatioSetting = new DatabasePublicSetting<number|null>('commentRateLimitDownvoteRatio', null)

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
    { _id: {$in: postIds}, $and: [{userId: {$ne: userId}}, {"coauthorStatuses.userId": {$ne: userId}}]}, {projection: {_id:1}
  }).fetch()
  const postsNotAuthoredByCommenterIds = postsNotAuthoredByCommenter.map(post => post._id)
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

function getNextAbleToSubmitDate(documents: Array<DbPost|DbComment>, intervalType:  "seconds"|"hours", intervalAmount: number, itemsPerInterval:number): Date|null {
  // make sure documents are sorted by descending date
  const sortedDocs = documents.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
  const docsInInterval = sortedDocs.filter(doc => doc.postedAt > moment().subtract(intervalAmount, intervalType).toDate())
  const doc = docsInInterval[itemsPerInterval - 1]
  if (!doc) return null 
  return moment(doc.postedAt).add(intervalAmount, intervalType).toDate()
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

function getStrictestPostRateLimitInfo(postsInTimeframe: Array<DbPost>, modRateLimitHours: number): RateLimitInfo|null {
  // for each rate limit, get the next date that user could post
  const modLimitNextPostDate = (modRateLimitHours > 0) ? getNextAbleToSubmitDate(postsInTimeframe, "hours", modRateLimitHours, 1) : null
  const dailyLimitNextPostDate = getNextAbleToSubmitDate(postsInTimeframe, "hours", 24, maxPostsPer24HoursSetting.get())
  const doublePostLimitNextPostDate = getNextAbleToSubmitDate(postsInTimeframe, "seconds", postIntervalSetting.get(), 1)

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
      rateLimitMessage: `Users cannot submit more than ${maxPostsPer24HoursSetting.get()} per day.`,
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
  console.log(userIsNotPrimaryAuthor, userIsNotCoauthor)
  return userIsNotPrimaryAuthor && userIsNotCoauthor
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
    : null;


  const eligibleForCommentOnSpecificPostRateLimit = (modPostSpecificRateLimitHours > 0 && await applyModRateLimitForPost(user._id, postId));
  const commentsOnSpecificPostInTimeframe = commentsOnOthersPostsInTimeframe.filter(comment => postId && comment.postId === postId);
  const modLimitNextCommentOnPostDate = eligibleForCommentOnSpecificPostRateLimit
    ? getNextAbleToSubmitDate(commentsOnSpecificPostInTimeframe, "hours", modPostSpecificRateLimitHours, 3)
    : null;

  const hasLowKarmaRateLimit = checkLowKarmaCommentRateLimit(user);
  const lowKarmaNextCommentDate = hasLowKarmaRateLimit
    ? getNextAbleToSubmitDate(commentsInTimeframe, "hours", .5, 4)
    : null;

  const hasDownvoteRatioRateLimit = checkDownvoteRatioCommentRateLimit(user);
  const highDownvoteRatioNextCommentDate = hasDownvoteRatioRateLimit
    ? getNextAbleToSubmitDate(commentsInTimeframe, "hours", .5, 4)
    : null;

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
  const karmaThreshold = commentRateLimitKarmaThresholdSetting.get();
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
  const downvoteRatioThreshold = commentRateLimitDownvoteRatioSetting.get()
  console.log({downvoteRatio, downvoteRatioThreshold})
  const aboveDownvoteRatioThreshold = downvoteRatioThreshold !== null && downvoteRatio > downvoteRatioThreshold

  return aboveDownvoteRatioThreshold
}
