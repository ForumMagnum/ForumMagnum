import { getCollection, Vulcan } from "./vulcan-lib";
import {
  recalculateScore,
  timeDecayExpr,
  postScoreModifiers,
  commentScoreModifiers,
  TIME_DECAY_FACTOR,
  getSubforumScoreBoost,
  SCORE_BIAS,
} from '../lib/scoring';
import * as _ from 'underscore';
import { Posts } from "../lib/collections/posts";
import { runSqlQuery } from "../lib/sql/sqlClient";

// INACTIVITY_THRESHOLD_DAYS =  number of days after which a single vote will not have a big enough effect to trigger a score update
//      and posts can become inactive
const INACTIVITY_THRESHOLD_DAYS = 30;

const getSingleVotePower = () =>
  // score increase amount of a single vote after n days (for n=100, x=0.000040295)
  1 / Math.pow((INACTIVITY_THRESHOLD_DAYS * 24) + SCORE_BIAS, TIME_DECAY_FACTOR.get());

interface BatchUpdateParams {
  inactive?: boolean;
  forceUpdate?: boolean;
}

/*

Update a document's score if necessary.

Returns how many documents have been updated (1 or 0).

*/
export const updateScore = async ({collection, item, forceUpdate}: {
  collection: any;
  item: DbPost;
  forceUpdate?: boolean;
}) => {

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
  const n = INACTIVITY_THRESHOLD_DAYS;
  // x = score increase amount of a single vote after n days (for n=100, x=0.000040295)
  const x = getSingleVotePower();

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

const getMongoCollectionProjections = (collectionName: CollectionNameString) => {
  const collectionProjections: Partial<Record<CollectionNameString, any>> = {
    Posts: {
      frontpageDate: 1,
      curatedDate: 1,
      scoreDate: {$cond: {if: "$frontpageDate", then: "$frontpageDate", else: "$postedAt"}},
      baseScore: { // Add optional bonuses to baseScore of posts
        $add: [
          "$baseScore",
          ...postScoreModifiers(),
        ],
      },
    },
    Comments: {
      baseScore: { // Add optional bonuses to baseScore of comments
        $add: [
          "$baseScore",
          ...commentScoreModifiers(),
        ],
      },
    },
  };
  return collectionProjections[collectionName] ?? {};
}

const getBatchItemsMongo = async <T extends DbObject>(collection: CollectionBase<T>, inactive: boolean) => {
  const x = getSingleVotePower();

  const inactiveFilter = inactive
    ? {inactive: true}
    : {
      $or: [
        {inactive: false},
        {inactive: {$exists: false}},
      ],
    };

  const items = await collection.aggregate([
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
        ...(getMongoCollectionProjections(collection.options.collectionName)),
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
  ]);

  return items.toArray();
}

const getPgCollectionProjections = (collectionName: CollectionNameString) => {
  const proj = {
    _id: '"_id"',
    postedAt: '"postedAt"',
    scoreDate: '"postedAt" AS "scoreDate"',
    score: '"score"',
    baseScore: '"baseScore"',
  };
  switch (collectionName) {
    case "Posts":
      proj.scoreDate = `(CASE WHEN "frontpageDate" IS NULL
        THEN "postedAt"
        ELSE "frontpageDate" END) AS "scoreDate"`;
      proj.baseScore = `("baseScore" +
        (CASE WHEN "frontpageDate" IS NULL THEN 0 ELSE 10 END) +
        (CASE WHEN "curatedDate" IS NULL THEN 0 ELSE 10 END)) AS "baseScore"`;
      break;
    case "Comments":
      const {base, magnitude, duration, exponent} = getSubforumScoreBoost();
      const ageHours = '(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - "createdAt") / 3600)';
      proj.baseScore = `("baseScore" + (CASE WHEN "tagCommentType" = 'SUBFORUM'
        THEN GREATEST(
          ${base},
          ${magnitude} * (1 - POW(${ageHours} / ${duration}, ${exponent}))
        )
        ELSE 0 END)) as "baseScore"`;
      break;
  }
  return Object.values(proj);
}

const getBatchItemsPg = async <T extends DbObject>(collection: CollectionBase<T>, inactive: boolean) => {
  const {collectionName} = collection;
  if (!["Posts", "Comments"].includes(collectionName)) {
    return [];
  }

  const singleVotePower = getSingleVotePower();

  const ageHours = 'EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - "postedAt") / 3600';
  return runSqlQuery(`
    SELECT
      q.*,
      ns."newScore",
      ABS("score" - ns."newScore") > $1 AS "scoreDiffSignificant",
      (${ageHours}) > ($2 * 24) AS "oldEnough"
    FROM (
      SELECT ${getPgCollectionProjections(collectionName).join(", ")}
      FROM "${collectionName}"
      WHERE
        "postedAt" < CURRENT_TIMESTAMP AND
        ${inactive ? '"inactive" = TRUE' : '("inactive" = FALSE OR "inactive" IS NULL)'}
    ) q, LATERAL (SELECT
      "baseScore" / POW(${ageHours} + $3, $4) AS "newScore"
    ) ns
  `, [singleVotePower, INACTIVITY_THRESHOLD_DAYS, SCORE_BIAS, TIME_DECAY_FACTOR.get()]);
}

const getBatchItems = async <T extends DbObject>(collection: CollectionBase<T>, inactive: boolean) =>
  Posts.isPostgres()
    ? getBatchItemsPg(collection, inactive)
    : getBatchItemsMongo(collection, inactive);

export const batchUpdateScore = async ({collection, inactive = false, forceUpdate = false}: BatchUpdateParams & { collection: CollectionBase<DbObject> }) => {
  const items = await getBatchItems(collection, inactive);
  let updatedDocumentsCounter = 0;
  const itemUpdates = _.compact(items.map((i: AnyBecauseTodo) => {
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

export const batchUpdateScoreByName = ({collectionName, inactive = false, forceUpdate = false}: BatchUpdateParams & { collectionName: CollectionNameString }) => {
  const collection = getCollection(collectionName);
  return batchUpdateScore({collection, inactive, forceUpdate});
}

Vulcan.batchUpdateScoreByName = batchUpdateScoreByName;
