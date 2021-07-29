import {valueToObjectRepresentation} from '@apollo/client/utilities';
import Users from '../../lib/collections/users/collection';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';

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
    void Users.update({_id: newDocument.userId}, {$inc: {"karma": vote.power}});
  }
});

voteCallbacks.cancelAsync.add(function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma if the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.update({_id: newDocument.userId}, {$inc: {"karma": -vote.power}});
  }
});


voteCallbacks.castVoteAsync.add(async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    void Users.update({_id: vote.userId}, {$inc: {[field]: 1, voteCount: 1}});
  }
});

voteCallbacks.cancelAsync.add(async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    void Users.update({_id: vote.userId}, {$inc: {[field]: -1, voteCount: -1}});
  }
});

voteCallbacks.castVoteAsync.add(async function updateNeedsReview (document: VoteDocTuple) {
  const voter = await Users.findOne(document.vote.userId);
  // voting should only be triggered once (after getting snoozed, they will not re-trigger for sunshine review)
  if (voter && voter.voteCount >= 20 && !voter.reviewedByUserId) {
    void Users.update({_id:voter._id}, {$set:{needsReview: true}})
  }
});

voteCallbacks.castVoteAsync.add(async function handleDisableCommenting (document: VoteDocTuple) {
  const author = await Users.findOne(document.vote.authorId);
  const power = await Users.findOne(document.vote.power)
  console.log("author karma: ", author?.karma, " author commenting disabled: ", author?.commentingDisabled)

  // Prevent users from commenting once their karma goes below a threshold
  const threshold = -1
  if (author) {
    // BUG: this can fail for async reasons, in the case where the karma is updated before the author object is queried, and hence power has already been included
    if (author?.karma <= threshold ) {
      if (power + (author?.karma) > threshold) {
        void Users.update({_id:author?._id}, {$set:{commentingDisabled: false}})
      } else {
        void Users.update({_id:author?._id}, {$set:{commentingDisabled: true}})
      }
    }
  }
})