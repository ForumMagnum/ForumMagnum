import moment from 'moment';
import { captureEvent } from '../../lib/analyticsEvents';
import Users from '../../lib/collections/users/collection';
import { getCollectionHooks } from '../mutationCallbacks';
import { rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost } from '../rateLimitUtils';
import { userIsAdminOrMod, userOwns } from '@/lib/vulcan-users/permissions.ts';
import LWEventsRepo from '../repos/LWEventsRepo';
import { isEAForum } from '@/lib/instanceSettings';
import { DatabaseServerSetting } from '../databaseSettings';

const changesAllowedSetting = new DatabaseServerSetting<number>('displayNameRateLimit.changesAllowed', 1);
const sinceDaysAgoSetting = new DatabaseServerSetting<number>('displayNameRateLimit.sinceDaysAgo', 60);

// Post rate limiting
getCollectionHooks("Posts").createValidate.add(async function PostsNewRateLimit (validationErrors, { newDocument: post, currentUser }) {
  if (!post.draft && !post.isEvent) {
    await enforcePostRateLimit(currentUser!);
  }
  return validationErrors;
});

getCollectionHooks("Posts").updateValidate.add(async function PostsUndraftRateLimit (validationErrors, { oldDocument, newDocument, currentUser }) {
  // Only undrafting is rate limited, not other edits
  if (oldDocument.draft && !newDocument.draft && !newDocument.isEvent) {
    await enforcePostRateLimit(currentUser!);
  }
  return validationErrors;
});

getCollectionHooks("Users").updateValidate.add(async function ChangeDisplayNameRateLimit (validationErrors, { oldDocument, newDocument, currentUser }) {
  if (oldDocument.displayName !== newDocument.displayName) {
    await enforceDisplayNameRateLimit({ userToUpdate: oldDocument, currentUser: currentUser! });
  }
  return validationErrors;
});

getCollectionHooks("Comments").createValidate.add(async function CommentsNewRateLimit (validationErrors, { newDocument: comment, currentUser, context }) {
  if (!currentUser) {
    throw new Error(`Can't comment while logged out.`);
  }
  await enforceCommentRateLimit({user: currentUser, comment, context});

  return validationErrors;
});

getCollectionHooks("Comments").createAsync.add(async ({document, context}: {
  document: DbComment
  context: ResolverContext
}) => {
  const user = await Users.findOne(document.userId)
  
  if (user) {
    const rateLimit = await rateLimitDateWhenUserNextAbleToComment(user, null, context)
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

async function enforceDisplayNameRateLimit({userToUpdate, currentUser}: {userToUpdate: DbUser, currentUser: DbUser}) {
  if (userIsAdminOrMod(currentUser)) return;

  if (!userOwns(currentUser, userToUpdate)) {
    throw new Error(`You do not have permission to update this user`)
  }

  if (!isEAForum) return;

  const sinceDaysAgo = sinceDaysAgoSetting.get();
  const changesAllowed = changesAllowedSetting.get();

  const nameChangeCount = await new LWEventsRepo().countDisplayNameChanges({
    userId: userToUpdate._id,
    sinceDaysAgo,
  });

  if (nameChangeCount >= changesAllowed) {
    const times = changesAllowed === 1 ? 'time' : 'times';
    throw new Error(`You can only change your display name ${changesAllowed} ${times} every ${sinceDaysAgo} days. Please contact support if you would like to change it again`);
  }
}

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

async function enforceCommentRateLimit({user, comment, context}: {
  user: DbUser,
  comment: DbInsertion<DbComment>,
  context: ResolverContext,
}) {
  const rateLimit = await rateLimitDateWhenUserNextAbleToComment(user, comment.postId, context);
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
