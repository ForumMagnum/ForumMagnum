import { Posts } from '../../lib/collections/posts'
import { userIsAdmin, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { getCollectionHooks } from '../mutationCallbacks';
import { userTimeSinceLast, userNumberOfItemsInPast24Hours } from '../../lib/vulcan-users/helpers';
import { ModeratorActions } from '../../lib/collections/moderatorActions';
import Comments from '../../lib/collections/comments/collection';

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

  const moderatorRateLimit = await ModeratorActions.findOne({ userId: user._id, type: 'rateLimitOnePerDay', active: true });
  if (numberOfPostsInPast24Hours > 0 && moderatorRateLimit) {
    throw new Error(`You have been rate limited to 1 post per day.`);
  }
}

async function enforceCommentRateLimit(user: DbUser) {
  if (userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment")) {
    return;
  }
  const timeSinceLastComment = await userTimeSinceLast(user, Comments);
  const commentInterval = Math.abs(parseInt(""+commentIntervalSetting.get()));

  // check that user waits more than 15 seconds between comments
  if((timeSinceLastComment < commentInterval)) {
    throw new Error(`Please wait ${commentInterval-timeSinceLastComment} seconds before commenting again.`);
  }

  const [numberOfCommentsInPast24Hours, moderatorRateLimit] = await Promise.all([
    userNumberOfItemsInPast24Hours(user, Comments),
    ModeratorActions.findOne({ userId: user._id, type: 'rateLimitOnePerDay', active: true })
  ]);

  if (numberOfCommentsInPast24Hours > 0 && moderatorRateLimit) {
    throw new Error(`You have been rate limited to 1 comment per day.`);
  }
}
