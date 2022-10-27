import { getCollection, Vulcan } from "./vulcan-lib";
import { recalculateScore, timeDecayExpr, defaultScoreModifiers, TIME_DECAY_FACTOR } from '../lib/scoring';
import * as _ from 'underscore';

/*

Update a document's score if necessary.

Returns how many documents have been updated (1 or 0).

*/
export const updateScore = async ({collection, item, forceUpdate}) => {

  // Age Check
  const postedAt = item?.frontpageDate?.valueOf() || item?.postedAt?.valueOf()
  const now = new Date().getTime();
  const age = now - postedAt;
  const ageInHours = age / (60 * 60 * 1000);

  // If for some reason item doesn't have a "postedAt" property, abort
  // Or, if post has been scheduled in the future, don't update its score
  if (!postedAt || postedAt > now)
    return 0;



  // For performance reasons, the database is only updated if the difference between the old score and the new score
  // is meaningful enough. To find out, we calculate the "power" of a single vote after n days.
  // We assume that after n days, a single vote will not be powerful enough to affect posts' ranking order.
  // Note: sites whose posts regularly get a lot of votes can afford to use a lower n.

  // n =  number of days after which a single vote will not have a big enough effect to trigger a score update
  //      and posts can become inactive
  const n = 30;
  // x = score increase amount of a single vote after n days (for n=100, x=0.000040295)
  const x = 1/Math.pow((n*24)+2, 1.3);

  // HN algorithm
  const newScore = recalculateScore(item);

  // Note: before the first time updateScore runs on a new item, its score will be at 0
  const scoreDiff = Math.abs(item.score || 0 - newScore);

  // console.log('// now: ', now)
  // console.log('// age: ', age)
  // console.log('// ageInHours: ', ageInHours)
  // console.log('// baseScore: ', baseScore)
  // console.log('// item.score: ', item.score)
  // console.log('// newScore: ', newScore)
  // console.log('// scoreDiff: ', scoreDiff)
  // console.log('// x: ', x)

  // only update database if difference is larger than x to avoid unnecessary updates
  if (forceUpdate || scoreDiff > x) {
    await collection.updateOne(item._id, {$set: {score: newScore, inactive: false}});
    return 1;
  } else if(ageInHours > n*24) {
    // only set a post as inactive if it's older than n days
    await collection.updateOne(item._id, {$set: {inactive: true}});
  }
  return 0;
};

const getCollectionProjections = (collectionName: CollectionNameString) => {
  const collectionProjections: Partial<Record<CollectionNameString, any>> = {
    Posts: {
      frontpageDate: 1,
      curatedDate: 1,
      scoreDate: {$cond: {if: "$frontpageDate", then: "$frontpageDate", else: "$postedAt"}},
      baseScore: { // Add optional bonuses to baseScore of posts
        $add: [
          "$baseScore",
          ...defaultScoreModifiers(),
        ],
      },
    },
  };
  return collectionProjections[collectionName] ?? {};
}

export const batchUpdateScore = async ({collection, inactive = false, forceUpdate = false}) => {
  // INACTIVITY_THRESHOLD_DAYS =  number of days after which a single vote will not have a big enough effect to trigger a score update
  //      and posts can become inactive
  const INACTIVITY_THRESHOLD_DAYS = 30;
  // x = score increase amount of a single vote after n days (for n=100, x=0.000040295)
  const x = 1 / Math.pow((INACTIVITY_THRESHOLD_DAYS*24) + 2, TIME_DECAY_FACTOR.get());

  const inactiveFilter = inactive
    ? {inactive: true}
    : {
      $or: [
        {inactive: false},
        {inactive: {$exists: false}},
      ],
    };

  const itemsPromise = collection.aggregate([
    {
      $match: {
        $and: [
          {postedAt: {$exists: true}},
          {postedAt: {$lte: new Date()}},
          inactiveFilter,
        ]
      }
    },
    {
      $project: {
        postedAt: 1,
        scoreDate: "$postedAt",
        score: 1,
        baseScore: 1,
        ...(getCollectionProjections(collection.options.collectionName)),
      }
    },
    {
      $project: {
        postedAt: 1,
        scoreDate: 1,
        baseScore: 1,
        score: 1,
        newScore: {
          $divide: [
            '$baseScore',
            timeDecayExpr(),
          ]
        }
      }
    },
    {
      $project: {
        postedAt: 1,
        scoreDate: 1,
        baseScore: 1,
        score: 1,
        newScore: 1,
        scoreDiffSignificant: {
          $gt: [
            {$abs: {$subtract: ['$score', '$newScore']}},
            x
          ]
        },
        oldEnough: { // Only set a post as inactive if it's older than n days
          $gt: [
            {$divide: [
              {
                $subtract: [new Date(), '$scoreDate'] // Difference in miliseconds
              },
              60 * 60 * 1000 //Difference in hours
            ]},
            INACTIVITY_THRESHOLD_DAYS*24]
        }
      }
    },
  ])

  const items = await itemsPromise;
  const itemsArray = await items.toArray();
  let updatedDocumentsCounter = 0;
  const itemUpdates = _.compact(itemsArray.map(i => {
    if (forceUpdate || i.scoreDiffSignificant) {
      updatedDocumentsCounter++;
      return {
        updateOne: {
          filter: {_id: i._id},
          update: {$set: {score: i.newScore, inactive: false}},
          upsert: false,
        }
      }
    } else if (i.oldEnough) {
      // only set a post as inactive if it's older than n days
      return {
        updateOne: {
          filter: {_id: i._id},
          update: {$set: {inactive: true}},
          upsert: false,
        }
      }
    }
  }))
  if (itemUpdates && itemUpdates.length) {
    await collection.rawCollection().bulkWrite(itemUpdates, {ordered: false});
  }
  return updatedDocumentsCounter;
}

export const batchUpdateScoreByName = ({collectionName, inactive = false, forceUpdate = false}) => {
  const collection = getCollection(collectionName);
  return batchUpdateScore({collection, inactive, forceUpdate});
}

Vulcan.batchUpdateScoreByName = batchUpdateScoreByName;
