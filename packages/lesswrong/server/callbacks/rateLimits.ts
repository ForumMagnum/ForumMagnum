import { Posts } from '../../lib/collections/posts'
import { userIsAdmin, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { getCollectionHooks } from '../mutationCallbacks';
import { userTimeSinceLast, userNumberOfItemsInPast24Hours, userNumberOfItemsInPastTimeframe, getNthMostRecentItemDate } from '../../lib/vulcan-users/helpers';
import { ModeratorActions } from '../../lib/collections/moderatorActions';
import Comments from '../../lib/collections/comments/collection';
import { MODERATOR_ACTION_TYPES, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK, rateLimits, RateLimitType } from '../../lib/collections/moderatorActions/schema';
import { getModeratorRateLimit, getTimeframeForRateLimit, userHasActiveModeratorActionOfType } from '../../lib/collections/moderatorActions/helpers';
import { isInFuture } from '../../lib/utils/timeUtil';
import moment from 'moment';

const countsTowardsRateLimitFilter = {
  draft: false,
};


const postIntervalSetting = new DatabasePublicSetting<number>('forum.postInterval', 30) // How long users should wait between each posts, in seconds
const maxPostsPer24HoursSetting = new DatabasePublicSetting<number>('forum.maxPostsPerDay', 5) // Maximum number of posts a user can create in a day

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

const commentIntervalSetting = new DatabasePublicSetting<number>('commentInterval', 15) // How long users should wait in between comments (in seconds)
getCollectionHooks("Comments").createValidate.add(async function CommentsNewRateLimit (validationErrors, { newDocument: comment, currentUser }) {
  if (!currentUser) {
    throw new Error(`Can't comment while logged out.`);
  }

  await enforceCommentRateLimit(currentUser, comment);

  return validationErrors;
});

// Check whether the given user can post a post right now. If they can, does
// nothing; if they would exceed a rate limit, throws an exception.
async function enforcePostRateLimit (user: DbUser) {
  // Admins and Sunshines aren't rate-limited
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment") || userIsMemberOf(user, "canBypassPostRateLimit"))
    return;
  
  const moderatorRateLimit = await getModeratorRateLimit(user)
  if (moderatorRateLimit) {
    const hours = getTimeframeForRateLimit(moderatorRateLimit.type)

    const postsInPastTimeframe = await userNumberOfItemsInPastTimeframe(user, Posts, hours)
  
    if (postsInPastTimeframe > 0) {
      throw new Error(MODERATOR_ACTION_TYPES[moderatorRateLimit.type]);
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

async function enforceCommentRateLimit(user: DbUser, comment: DbComment) {
  const rateLimit = await rateLimitDateWhenUserNextAbleToComment(user);
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

type RateLimitReason = "moderator"|"lowKarma"|"universal"

/**
 * If the user is rate-limited, return the date/time they will next be able to
 * comment. If they can comment now, returns null.
 */
export async function rateLimitDateWhenUserNextAbleToComment(user: DbUser): Promise<{
  nextEligible: Date,
  rateLimitType: RateLimitReason
}|null> {
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment")) {
    return null;
  }

  // If moderators have imposed a rate limit on this user, enforce that
  const moderatorRateLimit = await getModeratorRateLimit(user)
  if (moderatorRateLimit) {
    const hours = getTimeframeForRateLimit(moderatorRateLimit.type)

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
  
  // commented out for now until EA Forum reviews
  // If less than 30 karma, you are also limited to no more than 3 comments per
  // 0.5 hours.
  // if (!(user.karma >= 30)) {
  //   const thirdMostRecentCommentDate = await getNthMostRecentItemDate({
  //     user, collection: Comments,
  //     n: 3,
  //     cutoffHours: 0.5,
  //   });
    
  //   if (thirdMostRecentCommentDate) {
  //     const nextEligible = moment(thirdMostRecentCommentDate).add(0.5, 'hours').toDate();
  //     if (isInFuture(nextEligible)) {
  //       return {
  //         nextEligible,
  //         rateLimitType: "lowKarma",
  //       };
  //     }
  //   }
  // }

  const commentInterval = Math.abs(parseInt(""+commentIntervalSetting.get()));

  // check that user waits more than 15 seconds between comments
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
  if (postId && await userHasActiveModeratorActionOfType(user, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK)) {
    const HOURS = 24 * 7
    const NUMBER_OF_COMMENTS = 3
    const thirdMostRecentCommentDate = await getNthMostRecentItemDate({
      user, collection: Comments,
      n: NUMBER_OF_COMMENTS,
      cutoffHours: HOURS,
      filter: { postId },
    });
    if (thirdMostRecentCommentDate) {
      return {
        nextEligible: moment(thirdMostRecentCommentDate).add(HOURS, 'hours').toDate(),
        rateLimitType: "moderator",
      };
    }
  }
  return null;
}
