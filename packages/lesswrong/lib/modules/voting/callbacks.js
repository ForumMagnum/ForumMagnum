import { addCallback } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';

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
addCallback("votes.bigDowvote.async", updateKarma);

function cancelVoteKarma({newDocument, vote}, collection, user, context) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId) {
    Users.update({_id: newDocument.userId}, {$inc: {"karma": -vote.power}});
  }
}

addCallback("votes.cancel.async", cancelVoteKarma);
