import ReviewVotes from '../../server/collections/reviewVotes/collection'
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("ReviewVotes").createValidate.add(async function ensureUniqueVotes(errors, {newDocument: newVote}) {
  const {userId, postId} = newVote
  const oldVote = await ReviewVotes.findOne({postId, userId})
  if (oldVote) throw Error("You can't have two review votes of the same type on the same document")
  return errors
});
