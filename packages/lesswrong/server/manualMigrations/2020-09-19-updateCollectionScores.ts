/* eslint-disable no-console */
// Given all the console logs, this seemed more elegant than commenting on every one
import { registerMigration } from './migrationUtils';
import { Votes } from '../../lib/collections/votes/collection';
import Users from '../../lib/collections/users/collection';
import { getCollection } from '../vulcan-lib/getCollection';


export default registerMigration({
  name: "updateCollectionScores",
  dateWritten: "2020-09-19",
  idempotent: true,
  action: async () => {
    await recomputeCollectionScores("Posts", true)
    await recomputeCollectionScores("Comments", true)
    await recomputeCollectionScores("TagRels")
    await recomputeUserKarma()
  }
})

const recomputeCollectionScores = async (collectionName: CollectionNameString, includeAf = false) => {
  const collection = getCollection(collectionName);
  const newScores = await Votes.aggregate([
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
  ], {
    allowDiskUse: true
  }).toArray()

  console.log(`Computed new karma totals for ${newScores.length} documents in ${collectionName}`)

  for (const chunk of chunkArray(newScores, 1000)) {
    await collection.rawCollection().bulkWrite(chunk.map(({_id, karmaTotal, karmaTotalAf}) => ({
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
    console.log(`Finished inserting chunk`)
  }

  

  console.log(`Finished updating ${collectionName} scores. Updated ${newScores.length} documents.`)
}

const recomputeUserKarma = async () => {
  const newScores: {_id: string, karmaTotal: number, afKarmaTotal: number}[] = await Votes.aggregate([
    {
      $match: {
        cancelled: false,
        collectionName: {$in: ["Posts", "Comments"]},
        $expr: {$not: {$in: ["$userId", "$authorIds"]}},
      }
    },
    {
        $project: {
            authorIds: 1,
            power: 1,
            adjustedAfPower: {$cond: [{$eq: ['$documentIsAf', true]}, '$afPower', 0]},
        }
    },
    {
      $unwind: '$authorIds',
    },
    {
      $group: {
        _id: '$authorIds',
        karmaTotal: {$sum: "$power"},
        afKarmaTotal: {$sum: "$adjustedAfPower"}
      }
    }
  ], {
    allowDiskUse: true
  }).toArray()

  console.log(`Finished generating updates for ${newScores.length} users.`)

  for (const chunk of chunkArray(newScores, 1000)) {
    await Users.rawCollection().bulkWrite(chunk.map(({ _id }) => ({
      updateOne: {
        filter: { _id },
        update: {
          $rename: {
            karma: 'oldKarma'
          },
        }
      }
    })),
    { ordered: false });
    await Users.rawCollection().bulkWrite(chunk.map(({_id, karmaTotal, afKarmaTotal }) => ({
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
    console.log(`Finished inserting chunk`)
  }

  

  console.log(`Finished updating User karma. Updated ${newScores.length} users.`)
}

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice((i * size), (i * size) + size)
  );
}
