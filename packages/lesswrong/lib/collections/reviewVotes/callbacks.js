import ReviewVotes from './collection'
import { addCallback } from 'meteor/vulcan:core';

async function ensureUniqueVotes(errors, {newDocument: newVote}) {
  const {userId, postId} = newVote
  const oldVote = await ReviewVotes.findOne({postId, userId})
  if (oldVote) throw Error("You can't have two review votes of the same type on the same document")
  return errors
}

addCallback('reviewVote.create.validate', ensureUniqueVotes);
