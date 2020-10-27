import { Posts } from '../../lib/collections/posts'
import Users from '../../lib/collections/users/collection';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { getCollectionHooks } from '../mutationCallbacks';

const countsTowardsRateLimitFilter = {
  draft: false,
};


const postIntervalSetting = new DatabasePublicSetting<number>('forum.postInterval', 30) // How long users should wait between each posts, in seconds
const maxPostsPer24HoursSetting = new DatabasePublicSetting<number>('forum.maxPostsPerDay', 5) // Maximum number of posts a user can create in a day

// Post rate limiting
getCollectionHooks("Posts").createValidate.add(function PostsNewRateLimit (validationErrors, { newDocument: post, currentUser }) {
  if (!post.draft) {
    enforcePostRateLimit(currentUser);
  }
  
  return validationErrors;
});

getCollectionHooks("Posts").updateValidate.add(function PostsUndraftRateLimit (validationErrors, { oldDocument, newDocument, currentUser }) {
  // Only undrafting is rate limited, not other edits
  if (oldDocument.draft && !newDocument.draft) {
    enforcePostRateLimit(currentUser);
  }
  
  return validationErrors;
});

// Check whether the given user can post a post right now. If they can, does
// nothing; if they would exceed a rate limit, throws an exception.
function enforcePostRateLimit (user) {
  // Admins and Sunshines aren't rate-limited
  if (Users.isAdmin(user) || Users.isMemberOf(user, "sunshineRegiment") || Users.isMemberOf(user, "canBypassPostRateLimit"))
    return;
  
  const timeSinceLastPost = Users.timeSinceLast(user, Posts, countsTowardsRateLimitFilter);
  const numberOfPostsInPast24Hours = Users.numberOfItemsInPast24Hours(user, Posts, countsTowardsRateLimitFilter);
  
  // check that the user doesn't post more than Y posts per day
  if(numberOfPostsInPast24Hours >= maxPostsPer24HoursSetting.get()) {
    throw new Error(`Sorry, you cannot submit more than ${maxPostsPer24HoursSetting.get()} posts per day.`);
  }
  // check that user waits more than X seconds between posts
  if(timeSinceLastPost < postIntervalSetting.get()) {
    throw new Error(`Please wait ${postIntervalSetting.get()-timeSinceLastPost} seconds before posting again.`);
  }
}
