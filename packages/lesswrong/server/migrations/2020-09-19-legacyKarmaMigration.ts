
import { registerMigration } from './migrationUtils';
import { Votes } from '../../lib/collections/votes';
import Users from '../../lib/vulcan-users';
import { getVotePower } from '../../lib/voting/new_vote_types';
import { getCollection } from '../vulcan-lib';


registerMigration({
  name: "legacyKarmaMigration",
  dateWritten: "2020-09-19",
  idempotent: true,
  action: async () => {
    // First we only get the relevant votes, which are all votes that are not self-votes
    // and are not cancelled. I should also do a sanity check to see how many votes there are that
    // are duplicated (i.e. have the same user-documentId pair but are not cancelled)
    const voteFields = {_id: 1, documentId: 1, userId: 1, authorId: 1, voteType: 1, collectionName: 1, cancelled: 1, documentIsAf: 1}
    const allVotes = await Votes.find({}, {sort: {votedAt: 1}}, voteFields).fetch()
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
    const allUsers = await Users.find({}, {},  {_id: 1}).fetch()

    const votePowerMap = new Map(allVotes.map(vote => [vote._id, 1]))
    const voteAfPowerMap = new Map(allVotes.map(vote => [vote._id, 0]))
    const userKarmaMap = new Map(allUsers.map(user => [user._id, 0]))
    const userAfKarmaMap = new Map(allUsers.map(user => [user._id, 0]))
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

    const allUpdatedVotes = await Votes.find({}, {sort: {votedAt: 1}}, voteFields).fetch()

    console.log("Got all the updated votes")

    let voteCount = 0;
    for (const vote of allUpdatedVotes) {
      const {_id, userId, authorId, voteType, cancelled, documentIsAf} = vote;
      const votingUserKarma = userKarmaMap.get(userId)
      const votingUserAfKarma = userAfKarmaMap.get(userId)
      if (votingUserKarma === undefined || votingUserAfKarma === undefined) {
        if (!cancelled) throw Error(`Couldn't find user for vote with userId ${userId}`)
        // If the vote is cancelled and we can't find the user who case the vote, we just leave it as is, 
        // since we don't have enough information to update the power
        continue
      } 

      const votePower = getVotePower(votingUserKarma, voteType)
      const afVotePower = votingUserAfKarma > 0 ? getVotePower(votingUserAfKarma, voteType) : 0

      const authorKarma = userKarmaMap.get(authorId)
      const authorAfKarma = userAfKarmaMap.get(authorId)
      // If the author of the content that we are voting on doesn't exist, we
      // still update the power, but we obviously can't update the karma of that user
      if (authorKarma !== undefined && authorAfKarma !== undefined) {
        if (doesVoteIncreaseKarma(vote)) userKarmaMap.set(authorId, authorKarma + votePower)
        if (doesVoteIncreaseKarma(vote) && documentIsAf) userAfKarmaMap.set(authorId, authorAfKarma + afVotePower)
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

    await recomputeCollectionScores("Posts", true)
    await recomputeCollectionScores("Comments", true)
    await recomputeCollectionScores("Tags")
    await recomputeUserKarma()
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
  return allVotes.flatMap(({_id, documentId, userId, cancelled}) => {
    if (!cancelled && seen.size === seen.add(`${documentId}_${userId}`).size) {
      return [_id]
    }
    return []
  })
}

const findInvalidVotes = (allVotes: DbVote[], userKarmaMap: Map<string, number>) => {
  return allVotes.flatMap(({_id, authorId, userId, cancelled}) => {
    if (!cancelled && userKarmaMap.get(authorId) === undefined) return [_id]
    if (!cancelled && userKarmaMap.get(userId) === undefined) return [_id]
    return []
  })
}

const recomputeCollectionScores = async (collectionName:string, includeAf = false) => {
  const collection = getCollection(collectionName);
  const newScores = await Votes.rawCollection().aggregate([
    {
      $match: {
        cancelled: false,
        collectionName
      }
    },
    {
      $project: {
          documentId: 1,
          power: 1,
          adjustedAfPower: {$cond: ['$documentIsAf', '$afPower', 0]}
      }
    },
    {
      $group: {
        _id: `$documentId`,
        karmaTotal: {$sum: "$power"},
        karmaTotalAf: {$sum: "$adjustedAfPower"}
      }
    }
  ]).toArray()

  await collection.rawCollection().bulkWrite(newScores.map(({_id, karmaTotal, karmaTotalAf}) => ({
    updateOne: {
      filter: { _id },
      update: {
        $set: includeAf ? 
        {
          baseScore: karmaTotal,
          afBaseScore: karmaTotalAf
        }
        :
        {
          baseScore: karmaTotal,
        }
      }
    }
  })),
  { ordered: false });

  console.log(`Finished updating ${collectionName} scores. Updated ${newScores.length} documents.`)
}

const recomputeUserKarma = async () => {
  const newScores = await Votes.rawCollection().aggregate([
    {
      $match: {
        cancelled: false,
        collectionName: {$in: ["Posts", "Comments"]}
      }
    },
    {
        $project: {
            authorId: 1,
            adjustedPower: {$cond: [{$ne: ['$userId', '$authorId']}, '$power', 0]},
            adjustedAfPower: {$cond: [{$ne: ['$userId', '$authorId'], $eq: ['$documentIsAf', true]}, '$afPower', 0 ]}
        }
    },
    {
      $group: {
        _id: '$authorId',
        karmaTotal: {$sum: "$adjustedPower"},
        afKarmaTotal: {$sum: "$adjustedAfPower"}
      }
    }
  ], {
    allowDiskUse: true
  }).toArray()

  await Users.rawCollection().bulkWrite(newScores.map(({_id, karmaTotal, afKarmaTotal}) => ({
    updateOne: {
      filter: { _id },
      update: {
        $set: {
          karma: karmaTotal,
          afKarma: afKarmaTotal
        }
      }
    }
  })),
  { ordered: false });

  console.log(`Finished updating User karma. Updated ${newScores.length} users.`)
}