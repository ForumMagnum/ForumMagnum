import { addCallback } from '../../lib/vulcan-lib';
import Users from '../../lib/collections/users/collection';

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
function updateKarma({newDocument, vote}, collection, user, context) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId) {
    Users.update({_id: newDocument.userId}, {$inc: {"karma": vote.power}});
  }
}

addCallback("votes.smallUpvote.async", updateKarma);
addCallback("votes.bigUpvote.async", updateKarma);
addCallback("votes.smallDownvote.async", updateKarma);
addCallback("votes.bigDownvote.async", updateKarma);

function cancelVoteKarma({newDocument, vote}, collection, user, context) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId) {
    Users.update({_id: newDocument.userId}, {$inc: {"karma": -vote.power}});
  }
}

addCallback("votes.cancel.async", cancelVoteKarma);


async function incVoteCount ({newDocument, vote},) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    Users.update({_id: vote.userId}, {$inc: {[field]: 1, voteCount: 1}});
  }
}

addCallback("votes.bigDownvote.async", incVoteCount);
addCallback("votes.bigUpvote.async", incVoteCount);
addCallback("votes.smallDownvote.async", incVoteCount);
addCallback("votes.smallUpvote.async", incVoteCount);

async function cancelVoteCount ({newDocument, vote}) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    Users.update({_id: vote.userId}, {$inc: {[field]: -1, voteCount: -1}});
  }
}

addCallback("votes.cancel.async", cancelVoteCount);

async function updateNeedsReview (document) {
  const voter = await Users.findOne(document.vote.userId);
  // voting should only be triggered once (after getting snoozed, they will not re-trigger for sunshine review)
  if (voter && voter.voteCount >= 10 && !voter.reviewedByUserId) {
    Users.update({_id:voter._id}, {$set:{needsReview: true}})
  }
}

addCallback("votes.bigDownvote.async", updateNeedsReview);
addCallback("votes.bigUpvote.async", updateNeedsReview);
addCallback("votes.smallDownvote.async", updateNeedsReview);
addCallback("votes.smallUpvote.async", updateNeedsReview);
