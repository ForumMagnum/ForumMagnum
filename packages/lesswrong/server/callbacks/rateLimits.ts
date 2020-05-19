import { Posts } from '../../lib/collections/posts'
import Users from '../../lib/collections/users/collection';
import { addCallback, getSetting } from '../vulcan-lib';

const countsTowardsRateLimitFilter = {
  draft: false,
};
const postInterval = Math.abs(parseInt(""+getSetting<number|string>('forum.postInterval', 30)));
const maxPostsPer24Hours = Math.abs(parseInt(""+getSetting<number|string>('forum.maxPostsPerDay', 5)));

// Post rate limiting
function PostsNewRateLimit (validationErrors, { newDocument: post, currentUser }) {
  if (!post.draft) {
    enforcePostRateLimit(currentUser);
  }
  
  return validationErrors;
}
addCallback('post.create.validate', PostsNewRateLimit);

function PostsUndraftRateLimit (validationErrors, { oldDocument, newDocument, currentUser }) {
  // Only undrafting is rate limited, not other edits
  if (oldDocument.draft && !newDocument.draft) {
    enforcePostRateLimit(currentUser);
  }
  
  return validationErrors;
}
addCallback('post.update.validate', PostsUndraftRateLimit);

// Check whether the given user can post a post right now. If they can, does
// nothing; if they would exceed a rate limit, throws an exception.
function enforcePostRateLimit (user) {
  // Admins and Sunshines aren't rate-limited
  if (Users.isAdmin(user) || Users.isMemberOf(user, "sunshineRegiment") || Users.isMemberOf(user, "canBypassPostRateLimit"))
    return;
  
  const timeSinceLastPost = Users.timeSinceLast(user, Posts, countsTowardsRateLimitFilter);
  const numberOfPostsInPast24Hours = Users.numberOfItemsInPast24Hours(user, Posts, countsTowardsRateLimitFilter);
  
  // check that the user doesn't post more than Y posts per day
  if(numberOfPostsInPast24Hours >= maxPostsPer24Hours) {
    throw new Error(`Sorry, you cannot submit more than ${maxPostsPer24Hours} posts per day.`);
  }
  // check that user waits more than X seconds between posts
  if(timeSinceLastPost < postInterval) {
    throw new Error(`Please wait ${postInterval-timeSinceLastPost} seconds before posting again.`);
  }
}
