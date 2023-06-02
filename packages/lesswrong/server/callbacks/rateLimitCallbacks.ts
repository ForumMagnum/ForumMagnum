import moment from 'moment';
import { captureEvent } from '../../lib/analyticsEvents';
import Users from '../../lib/collections/users/collection';
import { getCollectionHooks } from '../mutationCallbacks';
import { rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost } from '../rateLimits/utils';

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

getCollectionHooks("Comments").createAsync.add(async ({document, currentUser}) => {
  if (currentUser) {
    const rateLimit = await rateLimitDateWhenUserNextAbleToComment(currentUser, null)
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
