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
import chunk from "lodash/chunk";

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

const getBatchItemsPg = async <T extends DbObject>(collection: CollectionBase<T>, inactive: boolean, forceUpdate: boolean) => {
  const {collectionName} = collection;
  if (!["Posts", "Comments"].includes(collectionName)) {
    return [];
  }

  const ageHours = 'EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - "postedAt") / 3600';
  return runSqlQuery(`
    SELECT
      q.*,
      ns."newScore",
      q."inactive" AS "inactive",
      ABS("score" - ns."newScore") > ns."singleVotePower" AS "scoreDiffSignificant",
      ns."singleVotePower" AS "singleVotePower",
      (${ageHours}) > ($1 * 24) AS "oldEnough"
    FROM (
      SELECT ${getPgCollectionProjections(collectionName).join(", ")}
        , "${collectionName}".inactive as inactive
      FROM "${collectionName}"
      WHERE
        "postedAt" < CURRENT_TIMESTAMP AND
        ${inactive ? '"inactive" = TRUE' : '("inactive" = FALSE OR "inactive" IS NULL)'}
    ) q, LATERAL (SELECT
      "baseScore" / POW(${ageHours} + $2, $3) AS "newScore",
      1.0 / POW(${ageHours} + $2, $3) AS "singleVotePower"
    ) ns
    ${forceUpdate ? "" : 'WHERE ABS("score" - ns."newScore") > ns."singleVotePower" OR NOT q."inactive"'}
  `, [INACTIVITY_THRESHOLD_DAYS, SCORE_BIAS, TIME_DECAY_FACTOR.get()]);
}

const getBatchItems = async <T extends DbObject>(collection: CollectionBase<T>, inactive: boolean, forceUpdate: boolean) =>
  Posts.isPostgres()
    ? getBatchItemsPg(collection, inactive, forceUpdate)
    : getBatchItemsMongo(collection, inactive);

export const batchUpdateScore = async ({collection, inactive = false, forceUpdate = false}: BatchUpdateParams & { collection: CollectionBase<DbObject> }) => {
  const items = await getBatchItems(collection, inactive, forceUpdate);
  let updatedDocumentsCounter = 0;

  const batches = chunk(items, 1000); // divide items into chunks of 1000

  for (let batch of batches) {
    let itemUpdates = _.compact(batch.map((i: AnyBecauseTodo) => {
      if (forceUpdate || i.scoreDiffSignificant) {
        updatedDocumentsCounter++;
        return {
          updateOne: {
            filter: {_id: i._id},
            update: {$set: {score: i.newScore, inactive: false}},
            upsert: false,
          }
        }
      } else if (i.oldEnough && !i.inactive) {
        // only set a post as inactive if it's older than n days
        return {
          updateOne: {
            filter: {_id: i._id},
            update: {$set: {inactive: true}},
            upsert: false,
          }
        }
      }
    }));

    if (itemUpdates && itemUpdates.length) {
      await collection.rawCollection().bulkWrite(itemUpdates, {ordered: false});
    }
  }
  return updatedDocumentsCounter;
}

export const batchUpdateScoreByName = ({collectionName, inactive = false, forceUpdate = false}: BatchUpdateParams & { collectionName: CollectionNameString }) => {
  const collection = getCollection(collectionName);
  return batchUpdateScore({collection, inactive, forceUpdate});
}

Vulcan.batchUpdateScoreByName = batchUpdateScoreByName;
