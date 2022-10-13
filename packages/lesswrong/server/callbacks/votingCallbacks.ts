import Users from '../../lib/collections/users/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { postPublishedCallback } from '../notificationCallbacks';
import { batchUpdateScore } from '../updateScores';
import { triggerAutomodIfNeeded, triggerReviewIfNeeded } from "./sunshineCallbackUtils";

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]
voteCallbacks.castVoteAsync.add(function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: vote.power}});
  }
});

voteCallbacks.cancelAsync.add(function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: -vote.power}});
  }
});


voteCallbacks.castVoteAsync.add(async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[field]: 1, voteCount: 1}});
  }
});

voteCallbacks.cancelAsync.add(async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[field]: -1, voteCount: -1}});
  }
});

voteCallbacks.castVoteAsync.add(async function updateNeedsReview (document: VoteDocTuple) {
  return triggerReviewIfNeeded(document.vote.userId)
});

voteCallbacks.castVoteAsync.add(async function checkAutomod ({newDocument, vote}: VoteDocTuple) {
  if (newDocument.__collectionName === 'Comments') {
    void triggerAutomodIfNeeded(newDocument.userId)
  }
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
