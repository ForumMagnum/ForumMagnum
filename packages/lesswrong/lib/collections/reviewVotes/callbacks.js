import ReviewVotes from './collection'
import { addCallback, editMutation } from 'meteor/vulcan:core';

async function markOldVoteAsDeleted(newVote) {
  const {userId, postId} = newVote
  const oldVotes = await ReviewVotes.find({postId, userId}).fetch()
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
}

addCallback('reviewVote.create.before', markOldVoteAsDeleted);
