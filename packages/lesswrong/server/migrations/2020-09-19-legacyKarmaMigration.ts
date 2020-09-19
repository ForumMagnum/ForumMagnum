
import { registerMigration } from './migrationUtils';
import { Votes } from '../../lib/collections/votes';
import Users from '../../lib/vulcan-users';
import { getVotePower } from '../../lib/voting/new_vote_types';
import _ from 'lodash';

registerMigration({
  name: "legacyKarmaMigration",
  dateWritten: "2020-09-19",
  idempotent: true,
  action: async () => {
    // First we only get the relevant votes, which are all votes that are not self-votes
    // and are not cancelled. I should also do a sanity check to see how many votes there are that
    // are duplicated (i.e. have the same user-documentId pair but are not cancelled)
    const allVotes = await Votes.find({}, {sort: {votedAt: 1}}, {_id: 1, documentId: 1, userId: 1, authorId: 1, voteType: 1, collectionName: 1, cancelled: 1}).fetch()
    console.log("Got all the votes")
    findDuplicateVotes(allVotes)
    console.log("Checked for duplicate votes")
    const allUsers = await Users.find({}, {},  {_id: 1}).fetch()

    const votePowerMap = new Map(allVotes.map(vote => [vote._id, 1]))
    const userKarmaMap = new Map(allUsers.map(user => [user._id, 0]))

    console.log("Created the maps")

    let voteCount = 0;
    for (const vote of allVotes) {
      const {_id, userId, authorId, voteType} = vote;
      const votingUserKarma = userKarmaMap.get(userId)
      if (votingUserKarma === undefined) throw Error(`Couldn't find user for vote userId ${userId}`);
      const authorKarma = userKarmaMap.get(authorId)
      if (authorKarma === undefined) throw Error(`Couldn't find user for vote authorId ${authorId}`)

      const votePower = getVotePower(votingUserKarma, voteType)
      if (doesVoteIncreaseKarma(vote)) userKarmaMap.set(authorId,  + votePower)
      
      votePowerMap.set(_id, votePower)
      voteCount++
      if (voteCount % 1000 === 0) console.log("voteCount: ", voteCount)
    }

    console.log("Done processing votes")

    let changes: Array<any> = [...votePowerMap].map(([_id, votePower]) => ({
      updateOne: {
        filter: { _id },
        update: {
          $set: {
            power: votePower
          }
        }
      }
    }));

    console.log("Created changes")
        
    await Votes.rawCollection().bulkWrite(changes, { ordered: false });

    console.log("Writing changes")

    // We will have to ignore the power field of those votes, and replace it as we go. This means
    // we should construct a table that keeps track of the new power for each vote that we then later on play
    // onto the database
    
    // Does really make me think whether I should just do all of this in a single aggregate pipeline. One that 
    // finds out what the right power for the votes are, and then one that updates the underlying karma and basescores. 
    // But I don't really know how to maintain the secondary state I need for this, so at the very least I should just
    // start by writing it in Javascript and then later on fixing it. 
  }
})

const doesVoteIncreaseKarma = ({userId, authorId, collectionName, cancelled}:DbVote) => {
  if (cancelled) return false
  if (userId === authorId) return false
  if (!['Posts', 'Comments'].includes(collectionName)) return false
  return true
}

const findDuplicateVotes = (allVotes: DbVote[]) => {
  const seen = new Set()
  allVotes.forEach(({documentId, userId, cancelled}) => {
    if (!cancelled && seen.size === seen.add(`${documentId}_${userId}`).size) {
      console.log("Duplicate vote: ", documentId, userId)
    }
  })
}