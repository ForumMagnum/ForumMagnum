import { Posts } from '../../lib/collections/posts'
import { userIsAdmin, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { getCollectionHooks } from '../mutationCallbacks';
import { userTimeSinceLast, userNumberOfItemsInPast24Hours, userNumberOfItemsInPastTimeframe } from '../../lib/vulcan-users/helpers';
import Comments from '../../lib/collections/comments/collection';
import { MODERATOR_ACTION_TYPES } from '../../lib/collections/moderatorActions/schema';
import { getModeratorRateLimit, getTimeframeForRateLimit } from '../../lib/collections/moderatorActions/helpers';
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

  await enforceCommentRateLimit(currentUser);

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


export const userNumberOfCommentsOnOthersPostsInPastTimeframe = async (user: DbUser, hours: number) => {
  const mNow = moment();
  const comments = await Comments.find({
    userId: user._id,
    createdAt: {
      $gte: mNow.subtract(hours, 'hours').toDate(),
    },
  }).fetch();
  const postIds = comments.map(comment => comment.postId)
  const postsNotAuthoredByCommenter = await Posts.find({_id: {$in: postIds}, userId: {$ne:user._id}}).fetch()
  const postsNotAuthoredByCommenterIds = postsNotAuthoredByCommenter.map(post => post._id)
  const commentsOnNonauthorPosts = comments.filter(comment => postsNotAuthoredByCommenterIds.includes(comment.postId))
  return commentsOnNonauthorPosts.length
}


async function enforceCommentRateLimit(user: DbUser) {
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment")) {
    return;
  }

  const moderatorRateLimit = await getModeratorRateLimit(user)
  if (moderatorRateLimit) {
    const hours = getTimeframeForRateLimit(moderatorRateLimit.type)

    // moderatorRateLimits should only apply to comments on posts by people other than the comment author
    const commentsInPastTimeframe = await userNumberOfCommentsOnOthersPostsInPastTimeframe(user, hours)

    if (commentsInPastTimeframe > 0) {
      throw new Error(MODERATOR_ACTION_TYPES[moderatorRateLimit.type]);
    }
  }

  const timeSinceLastComment = await userTimeSinceLast(user, Comments);
  const commentInterval = Math.abs(parseInt(""+commentIntervalSetting.get()));

  // check that user waits more than 15 seconds between comments
  if((timeSinceLastComment < commentInterval)) {
    throw new Error(`Please wait ${commentInterval-timeSinceLastComment} seconds before commenting again.`);
  }

}
