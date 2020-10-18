import ReviewVotes from '../../lib/collections/reviewVotes/collection'
import { addCallback } from '../../lib/vulcan-lib';

async function ensureUniqueVotes(errors, {newDocument: newVote}) {
  const {userId, postId} = newVote
  const oldVote = await ReviewVotes.findOne({postId, userId})
  if (oldVote) throw Error("You can't have two review votes of the same type on the same document")
  return errors
}

addCallback('reviewVote.create.validate', ensureUniqueVotes);
