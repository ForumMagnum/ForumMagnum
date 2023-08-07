import { Posts } from '../../lib/collections/posts/collection';
import Users from '../../lib/collections/users/collection';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { postPublishedCallback } from '../notificationCallbacks';
import { checkForStricterRateLimits } from '../rateLimitUtils';
import { batchUpdateScore } from '../updateScores';
import { triggerCommentAutomodIfNeeded } from "./sunshineCallbackUtils";

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
export const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]
voteCallbacks.castVoteAsync.add(async function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser, context) {
  // Only update user karma if the operation isn't done by one of the item's current authors.
  // We don't want to let any of the authors give themselves or another author karma for this item.
  // We need to await it so that the subsequent check for whether any stricter rate limits apply can do a proper comparison between old and new karma
  if (!vote.authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName)) {
    await Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: vote.power}});
  }

  void checkForStricterRateLimits(vote.authorIds, context);
});

voteCallbacks.cancelAsync.add(function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // Only update user karma if the operation isn't done by one of the item's authors at the time of the original vote.
  // We expect vote.authorIds here to be the same as the authorIds of the original vote.
  if (!vote.authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: -vote.power}});
  }
});


voteCallbacks.castVoteAsync.add(async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  if (vote.voteType === "neutral") {
    return;
  }

  // Increment the count for the person casting the vote
  const casterField = `${vote.voteType}Count`

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[casterField]: 1, voteCount: 1}});
  }

  // Increment the count for the person receiving the vote
  const receiverField = `${vote.voteType}ReceivedCount`

  if (newDocument.userId !== vote.userId) {
    // update all users in vote.authorIds
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {[receiverField]: 1, voteReceivedCount: 1}});
  }
});

voteCallbacks.cancelAsync.add(async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  if (vote.voteType === "neutral") {
    return;
  }

  const casterField = `${vote.voteType}Count`

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[casterField]: -1, voteCount: -1}});
  }

  // Increment the count for the person receiving the vote
  const receiverField = `${vote.voteType}ReceivedCount`

  if (newDocument.userId !== vote.userId) {
    // update all users in vote.authorIds
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {[receiverField]: -1, voteReceivedCount: -1}});
  }
});


// getCollectionHooks("Votes").createBefore.add(async function recordPreVoteAutomodState(vote, { context }) {
//   // Cache the state of auto-rate-limits for users who are being voted on _before_ the vote takes effect
//   // This is used in the `checkAutomod` castVoteAsync callback to see if we need to put anyone in review for triggering a stricter rate limit
//   await cacheRateLimitInfoForUsers(vote.authorIds, null, context);

//   return vote;
// })

voteCallbacks.castVoteAsync.add(async function checkAutomod ({newDocument, vote}: VoteDocTuple, collection, user, context) {
  if (vote.collectionName === 'Comments') {
    void triggerCommentAutomodIfNeeded(newDocument, vote);
  }

  // Check if anyone has a stricter rate limit after the vote that was just cast, and put them in review if so
  // void compareCachedRateLimitsForReview2(vote.authorIds, context);
});


postPublishedCallback.add(async (publishedPost: DbPost) => {
  // When a post is published (undrafted), update its score. (That is, recompute
  // the time-decaying score used for sorting, since the time that's computed
  // relative to has just changed).
  //
  // To do this, we mark it `inactive:false` and update the scores on the
  // whole collection. (This is already something being done frequently by a
  // cronjob.)
  if (publishedPost.inactive) {
    await Posts.rawUpdateOne({_id: publishedPost._id}, {$set: {inactive: false}});
  }
  
  await batchUpdateScore({collection: Posts});
});
