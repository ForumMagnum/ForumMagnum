/* eslint-disable no-console */
// Given all the console logs, this seemed more elegant than commenting on every one
import { registerMigration } from './migrationUtils';
import { Votes } from '../../lib/collections/votes/collection';
import Users from '../../lib/collections/users/collection';
import { calculateVotePower } from '../../lib/voting/voteTypes';


export default registerMigration({
  name: "legacyKarmaMigration",
  dateWritten: "2020-09-19",
  idempotent: true,
  action: async () => {
    // First we only get the relevant votes, which are all votes that are not self-votes
    // and are not cancelled. I should also do a sanity check to see how many votes there are that
    // are duplicated (i.e. have the same user-documentId pair but are not cancelled)
    const allVotes = await Votes.find({}, {sort: {votedAt: 1}}).fetch()
    console.log("Got all the votes")
    const duplicateVotes = findDuplicateVotes(allVotes)
    console.log("Number of duplicate votes", duplicateVotes.length)

    if (duplicateVotes.length) {
      await Votes.rawCollection().bulkWrite(duplicateVotes.map(_id => ({
        updateOne: {
          filter: { _id },
          update: {
            $set: {
              cancelled: true
            }
          }
        }
      })), 
      { ordered: false });
    }

    console.log("Removed all duplicate votes")
    const allUsers = await Users.find({}, {},  {_id: 1, groups: 1}).fetch()

    const votePowerMap = new Map(allVotes.map(vote => [vote._id, 1]))
    const voteAfPowerMap = new Map(allVotes.map(vote => [vote._id, 0]))
    const userKarmaMap = new Map(allUsers.map(user => [user._id, 0]))
    // For the purpose of computation we assume that alignmentForum members start off with 1 karma,
    // giving them a small upvote weight of 1
    const userAfKarmaMap = new Map(allUsers.map(user => [user._id, user.groups?.includes("alignmentForum") ? 1 : 0]))
    console.log("Created the maps")

    const invalidVotes = findInvalidVotes(allVotes, userKarmaMap)

    console.log(`Found ${invalidVotes.length} invalid votes`)

    if (invalidVotes.length) {
      await Votes.rawCollection().bulkWrite(invalidVotes.map(_id => ({
        updateOne: {
          filter: { _id },
          update: {
            $set: {
              cancelled: true
            }
          }
        }
      })),
      { ordered: false });
    }

    console.log("Removed invalid votes")

    const allUpdatedVotes = await Votes.find({}, {sort: {votedAt: 1}}).fetch()

    console.log("Got all the updated votes")

    let voteCount = 0;
    for (const vote of allUpdatedVotes) {
      const {_id, userId, authorIds, voteType, cancelled, documentIsAf} = vote;
      const votingUserKarma = userKarmaMap.get(userId)
      const votingUserAfKarma = userAfKarmaMap.get(userId)
      if (votingUserKarma === undefined || votingUserAfKarma === undefined) {
        if (!cancelled) throw Error(`Couldn't find user for vote with userId ${userId}`)
        // If the vote is cancelled and we can't find the user who case the vote, we just leave it as is, 
        // since we don't have enough information to update the power
        continue
      } 

      const votePower = calculateVotePower(votingUserKarma, voteType)
      const afVotePower = votingUserAfKarma > 0 ? calculateVotePower(votingUserAfKarma, voteType) : 0

      if (!!authorIds) { 
        for (const authorId of authorIds) {
          const authorKarma = userKarmaMap.get(authorId)
          const authorAfKarma = userAfKarmaMap.get(authorId)
          // If the author of the content that we are voting on doesn't exist, we
          // still update the power, but we obviously can't update the karma of that user
          if (authorKarma !== undefined && authorAfKarma !== undefined) {
            if (doesVoteIncreaseKarma(vote, authorId)) userKarmaMap.set(authorId, authorKarma + votePower)
            if (doesVoteIncreaseKarma(vote, authorId) && documentIsAf) userAfKarmaMap.set(authorId, authorAfKarma + afVotePower)
          }
        }
      }

      votePowerMap.set(_id, votePower)
      voteAfPowerMap.set(_id, afVotePower)
      voteCount++
      if (voteCount % 100000 === 0) console.log("voteCount: ", voteCount)
    }

    console.log(`Done processing votes. Processed a total of ${votePowerMap.size} votes`)

    let changes: Array<any> = [...votePowerMap].map(([_id, votePower]) => ({
      updateOne: {
        filter: { _id },
        update: {
          $set: {
            power: votePower,
            afPower: voteAfPowerMap.get(_id) || 0
          }
        }
      }
    }));

    console.log("Created changes")
        
    await Votes.rawCollection().bulkWrite(changes, { ordered: false });


    console.log("Finished writing changes")
  }
})

const doesVoteIncreaseKarma = ({userId, collectionName, cancelled}: DbVote, authorId: string) => {
  if (cancelled) return false
  if (userId === authorId) return false
  if (!['Posts', 'Comments'].includes(collectionName)) return false
  return true
}

const findDuplicateVotes = (allVotes: DbVote[]) => {
  const seen = new Set()
  return allVotes.flatMap(({_id, documentId, userId, cancelled}) => {
    if (!cancelled && seen.size === seen.add(`${documentId}_${userId}`).size) {
      return [_id]
    }
    return []
  })
}

const findInvalidVotes = (allVotes: DbVote[], userKarmaMap: Map<string, number>) => {
  return allVotes.flatMap(({_id, authorIds, userId, cancelled}) => {
    if (!authorIds) return []
    for (const authorId of authorIds)
      if (!cancelled && userKarmaMap.get(authorId) === undefined) return [_id]
    if (!cancelled && userKarmaMap.get(userId) === undefined) return [_id]
    return []
  })
}
