import ReviewVotes from './collection'
import { addCallback, editMutation } from 'meteor/vulcan:core';

async function markOldVoteAsDeleted(newVote) {
  const {userId, postId, type} = newVote
  const oldVotes = await ReviewVotes.find({postId, userId, type}).fetch()
  oldVotes.forEach(vote => {
    editMutation({
      collection:ReviewVotes,
      documentId: vote._id,
      set: {
        deleted: true
      },
      unset: {},
      validate: false,
    })
  })
  return newVote
}

addCallback('reviewVote.create.before', markOldVoteAsDeleted);
