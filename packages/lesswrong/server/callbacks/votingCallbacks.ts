import Users from '../../lib/collections/users/collection';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
const collectionsThatAffectKarma = ["Posts", "Comments"]
voteCallbacks.castVoteAsync.add(function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    Users.update({_id: newDocument.userId}, {$inc: {"karma": vote.power}});
  }
});

voteCallbacks.cancelAsync.add(function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    Users.update({_id: newDocument.userId}, {$inc: {"karma": -vote.power}});
  }
});


voteCallbacks.castVoteAsync.add(async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    Users.update({_id: vote.userId}, {$inc: {[field]: 1, voteCount: 1}});
  }
});

voteCallbacks.cancelAsync.add(async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    Users.update({_id: vote.userId}, {$inc: {[field]: -1, voteCount: -1}});
  }
});

voteCallbacks.castVoteAsync.add(async function updateNeedsReview (document: VoteDocTuple) {
  const voter = await Users.findOne(document.vote.userId);
  // voting should only be triggered once (after getting snoozed, they will not re-trigger for sunshine review)
  if (voter && voter.voteCount >= 20 && !voter.reviewedByUserId) {
    Users.update({_id:voter._id}, {$set:{needsReview: true}})
  }
});
