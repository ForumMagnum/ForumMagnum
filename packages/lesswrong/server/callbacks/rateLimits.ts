import { Posts } from '../../lib/collections/posts'
import { userIsAdmin, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { getCollectionHooks } from '../mutationCallbacks';
import { userTimeSinceLast, userNumberOfItemsInPast24Hours, userNumberOfItemsInPastTimeframe } from '../../lib/vulcan-users/helpers';
import Comments from '../../lib/collections/comments/collection';
import { MODERATOR_ACTION_TYPES, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK, postAndCommentRateLimits, RateLimitType } from '../../lib/collections/moderatorActions/schema';
import { getModeratorRateLimit, getTimeframeForRateLimit, userHasActiveModeratorActionOfType } from '../../lib/collections/moderatorActions/helpers';
import { isInFuture } from '../../lib/utils/timeUtil';
import moment from 'moment';
import Users from '../../lib/collections/users/collection';
import { captureEvent } from '../../lib/analyticsEvents';
import { isEAForum } from '../../lib/instanceSettings';
import { RateLimitReason } from '../../lib/collections/users/schema';
import UserRateLimits from '../../lib/collections/userRateLimits/collection';

const countsTowardsRateLimitFilter = {
  draft: false,
};


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

export const getNthMostRecentItemDate = async function<
  T extends DbObject & {createdAt:Date}
>({user, collection, cutoffHours, n, filter}: {
  user: DbUser,
  collection: CollectionBase<T>,
  n: number,
  cutoffHours?: number,
  filter?: MongoSelector<T>
}): Promise<Date|null> {
  var mNow = moment();
  const items = await collection.find({
    userId: user._id,
    ...filter,
    ...(cutoffHours && {
      createdAt: {
        $gte: mNow.subtract(cutoffHours, 'hours').toDate(),
      },
    })
  }, {
    sort: ({createdAt: -1} as Partial<Record<keyof T,number>>),
    limit: n,
    projection: {createdAt:1},
  }).fetch();

  if (items.length < n)
    return null;
  else
    return items[n-1].createdAt;

};

function getUserRateLimits(user: DbUser) {
  return UserRateLimits.find({
    userId: user._id,
    $or: [{endedAt: null}, {endedAt: {$gt: new Date()}}]
  }, {
    sort: {
      createdAt: -1
    }
  }).fetch();
}

const isUserRateLimitOfType = <T extends DbUserRateLimit['type']>(type: T) => {
  return (userRateLimit: DbUserRateLimit): userRateLimit is DbUserRateLimit & { type: T } => userRateLimit.type === type;
};

const MS_IN_HOUR = 1000 * 60 * 60;

// Check whether the given user can post a post right now. If they can, does
// nothing; if they would exceed a rate limit, throws an exception.
async function enforcePostRateLimit (user: DbUser) {
  // Admins and Sunshines aren't rate-limited
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment") || userIsMemberOf(user, "canBypassPostRateLimit"))
    return;
  
  const [moderatorRateLimit, userRateLimits] = await Promise.all([getModeratorRateLimit(user), getUserRateLimits(user)]);
  if (moderatorRateLimit) {
    const hours = getTimeframeForRateLimit(moderatorRateLimit.type)

    const postsInPastTimeframe = await userNumberOfItemsInPastTimeframe(user, Posts, hours)
  
    if (postsInPastTimeframe > 0) {
      throw new Error(MODERATOR_ACTION_TYPES[moderatorRateLimit.type]);
    }
  }

  const userPostRateLimit = userRateLimits.find(isUserRateLimitOfType('allPosts'));
  if (userPostRateLimit) {
    const intervalHours = userPostRateLimit.intervalMs / MS_IN_HOUR;
    const allowedPostsPerInterval = userPostRateLimit.actionsPerInterval;

    const postsInPastTimeframe = await userNumberOfItemsInPastTimeframe(user, Posts, intervalHours);
    if (postsInPastTimeframe > allowedPostsPerInterval) {
      // TODO: maybe something to show [x] days if >24 hours (or [x] weeks, [y] days if > 168 hours?)
      throw new Error(`Sorry, you cannot submit more than ${allowedPostsPerInterval} posts per ${intervalHours} hours.`);
    }
  }

  const timeSinceLastPost = await userTimeSinceLast(user, Posts, countsTowardsRateLimitFilter);
  const numberOfPostsInPast24Hours = await userNumberOfItemsInPast24Hours(user, Posts, countsTowardsRateLimitFilter);
  
  // check that the user doesn't post more than Y posts per day
  if(numberOfPostsInPast24Hours >= maxPostsPer24HoursSetting.get()) {
    throw new Error(`Sorry, you cannot submit more than ${maxPostsPer24HoursSetting.get()} posts per day.`);
  }
  // check that user waits more than X seconds between posts
  if(timeSinceLastPost < postIntervalSetting.get()) {
    throw new Error(`Please wait ${postIntervalSetting.get()-timeSinceLastPost} seconds before posting again.`);
  }


}

const userNumberOfCommentsOnOthersPostsInPastTimeframe = async (user: DbUser, hours: number) => {
  const mNow = moment();
  const comments = await Comments.find({
    userId: user._id,
    createdAt: {
      $gte: mNow.subtract(hours, 'hours').toDate(),
    },
  }).fetch();
  const postIds = comments.map(comment => comment.postId)
  const postsNotAuthoredByCommenter = await Posts.find(
    { _id: {$in: postIds}, $or: [{userId: {$ne: user._id}}, {"coauthorStatuses.userId": {$ne: user._id}}]}, {projection: {_id:1}
  }).fetch()
  const postsNotAuthoredByCommenterIds = postsNotAuthoredByCommenter.map(post => post._id)
  const commentsOnNonauthorPosts = comments.filter(comment => postsNotAuthoredByCommenterIds.includes(comment.postId))
  return commentsOnNonauthorPosts.length
}

/**
 * Checks if the user is exempt from commenting rate limits (optionally, for the given post).
 *
 * Admins and mods are always exempt.
 * If the post has "ignoreRateLimits" set, then all users are exempt.
 * On forums other than the EA Forum, the post author is always exempt on their own posts.
 */
async function shouldIgnoreCommentRateLimit (user: DbUser, postId: string | null): Promise<boolean> {
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment")) {
    return true
  }
  if (postId) {
    const post = await Posts.findOne({_id: postId})
    const commenterIsPostAuthor = post && user._id === post.userId
    if (post?.ignoreRateLimits || (!isEAForum && commenterIsPostAuthor)) {
      return true
    }
  }
  return false
}


async function enforceCommentRateLimit({user, comment}:{user: DbUser, comment: DbComment}) {
  const rateLimit = await rateLimitDateWhenUserNextAbleToComment(user, comment.postId);
  if (rateLimit) {
    const {nextEligible, rateLimitType:_} = rateLimit;
    if (nextEligible > new Date()) {
      throw new Error(`Rate limit: You cannot comment until ${nextEligible}`);
    }
  }
  
  if (comment.postId) {
    const postSpecificRateLimit = await rateLimitGetPostSpecificCommentLimit(user, comment.postId);
    if (postSpecificRateLimit) {
      const {nextEligible, rateLimitType:_} = postSpecificRateLimit;
      if (nextEligible > new Date()) {
        throw new Error(`Rate limit: You cannot comment on this post until ${nextEligible}`);
      }
    }
  }
}

/**
 * Check if the user has a commenting rate limit due to having low karma.
 */
const checkLowKarmaCommentRateLimit = (user: DbUser): boolean => {
  const karmaThreshold = commentRateLimitKarmaThresholdSetting.get()
  return karmaThreshold !== null && user.karma < karmaThreshold
}

/**
 * Check if the user has a commenting rate limit due to having a high % of their received votes be downvotes.
 */
const checkDownvoteRatioCommentRateLimit = (user: DbUser): boolean => {
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
  const aboveDownvoteRatioThreshold = downvoteRatioThreshold !== null && downvoteRatio > downvoteRatioThreshold

  return aboveDownvoteRatioThreshold
}

/**
 * If the user is rate-limited, return the date/time they will next be able to
 * comment. If they can comment now, returns null.
 */
export async function rateLimitDateWhenUserNextAbleToComment(user: DbUser, postId: string | null): Promise<{
  nextEligible: Date,
  rateLimitType: RateLimitReason
}|null> {
  // if this user is a mod/admin or (on non-EAF forums) is the post author,
  // then they are exempt from all rate limits except for the "universal" 8 sec one
  const ignoreRateLimits = await shouldIgnoreCommentRateLimit(user, postId)
  
  if (!ignoreRateLimits) {
    // If moderators have imposed a rate limit on this user, enforce that
    const moderatorRateLimit = await getModeratorRateLimit(user)
    if (moderatorRateLimit) {
      const hours = getTimeframeForRateLimit(moderatorRateLimit.type)

      // moderatorRateLimits should only apply to comments on posts by people other than the comment author
      const commentsInPastTimeframe = await userNumberOfCommentsOnOthersPostsInPastTimeframe(user, hours)
    
      if (commentsInPastTimeframe > 0) {
        throw new Error(MODERATOR_ACTION_TYPES[moderatorRateLimit.type]);
      }

      const mostRecentInTimeframe = await getNthMostRecentItemDate({
        user, collection: Comments,
        n: 1,
        cutoffHours: hours,
      });
      if (mostRecentInTimeframe) {
        return {
          nextEligible: moment(mostRecentInTimeframe).add(hours, 'hours').toDate(),
          rateLimitType: "moderator",
        }
      }
    }
    
    // If the user has low karma, or their ratio of received downvotes to total votes is too high,
    // they are limited to no more than 4 comments per 0.5 hours.
    const hasLowKarma = checkLowKarmaCommentRateLimit(user)
    const hasHighDownvoteRatio = checkDownvoteRatioCommentRateLimit(user)
    if (hasLowKarma || hasHighDownvoteRatio) {
      const fourthMostRecentCommentDate = await getNthMostRecentItemDate({
        user,
        collection: Comments,
        n: 4,
        cutoffHours: 0.5,
      })
      if (fourthMostRecentCommentDate) {
        // if the user has hit the limit, then they are eligible to comment again
        // 30 min after their fourth most recent comment
        const nextEligible = moment(fourthMostRecentCommentDate).add(0.5, 'hours').toDate()
        const rateLimitType: RateLimitReason = hasLowKarma ? "lowKarma" : "downvoteRatio";

        return {
          nextEligible,
          rateLimitType
        }
      }
    }
  }

  const commentInterval = Math.abs(parseInt(""+commentIntervalSetting.get()));
  // check that user waits more than 8 seconds between comments
  const mostRecentCommentDate = await getNthMostRecentItemDate({
    user, collection: Comments,
    n: 1,
    cutoffHours: commentInterval/(60.0*60.0)
  });
  if (mostRecentCommentDate) {
    return {
      nextEligible: moment(mostRecentCommentDate).add(commentInterval, 'seconds').toDate(),
      rateLimitType: "universal",
    };
  }
  
  return null;
}

export async function rateLimitGetPostSpecificCommentLimit(user: DbUser, postId: string): Promise<{
  nextEligible: Date,
  rateLimitType: RateLimitReason,
}|null> {
  if (await shouldIgnoreCommentRateLimit(user, postId)) {
    return null
  }

  if (postId && await userHasActiveModeratorActionOfType(user, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK)) {
    const hours = 24 * 7
    const num_comments = 3
    const thirdMostRecentCommentDate = await getNthMostRecentItemDate({
      user, collection: Comments,
      n: num_comments,
      cutoffHours: hours,
      filter: { postId },
    });
    if (thirdMostRecentCommentDate) {
      return {
        nextEligible: moment(thirdMostRecentCommentDate).add(hours, 'hours').toDate(),
        rateLimitType: "moderator",
      };
    }
  }
  return null;
}
