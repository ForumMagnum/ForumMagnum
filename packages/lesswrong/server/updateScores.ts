import {
  TIME_DECAY_FACTOR,
  getSubforumScoreBoost,
  SCORE_BIAS,
} from '../lib/scoring';
import { runSqlQuery } from "@/server/sql/sqlClient";
import chunk from "lodash/chunk";
import compact from "lodash/compact";
import { getCollection } from "../lib/vulcan-lib/getCollection";

// INACTIVITY_THRESHOLD_DAYS =  number of days after which a single vote will not have a big enough effect to trigger a score update
//      and posts can become inactive
const INACTIVITY_THRESHOLD_DAYS = 30;

interface BatchUpdateParams {
  inactive?: boolean;
  forceUpdate?: boolean;
}

const getPgCollectionProjections = (collectionName: VoteableCollectionName) => {
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
    default:
      break;
  }
  return Object.values(proj);
}

const getBatchItemsPg = async <N extends VoteableCollectionName>(collection: CollectionBase<N>, inactive: boolean, forceUpdate: boolean) => {
  const {collectionName} = collection;
  if (!["Posts", "Comments"].includes(collectionName)) {
    return [];
  }

  const ageHours = 'EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - "postedAt") / 3600';
  return runSqlQuery(`
    -- updateScores.getBatchItemsPg
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
  `, [INACTIVITY_THRESHOLD_DAYS, SCORE_BIAS, TIME_DECAY_FACTOR.get()], "read");
}

const getBatchItems = <N extends VoteableCollectionName>(collection: CollectionBase<N>, inactive: boolean, forceUpdate: boolean) => {
  return getBatchItemsPg(collection, inactive, forceUpdate)
}

export const batchUpdateScore = async ({collection, inactive = false, forceUpdate = false}: BatchUpdateParams & { collection: CollectionBase<VoteableCollectionName> }) => {
  const items = await getBatchItems(collection, inactive, forceUpdate);
  let updatedDocumentsCounter = 0;

  const batches = chunk(items, 1000); // divide items into chunks of 1000

  for (let batch of batches) {
    let itemUpdates = compact(batch.map((i: AnyBecauseTodo) => {
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

// Exported to allow running manually with "yarn repl"
export const batchUpdateScoreByName = ({collectionName, inactive = false, forceUpdate = false}: BatchUpdateParams & { collectionName: VoteableCollectionName }) => {
  const collection = getCollection(collectionName);
  return batchUpdateScore({collection, inactive, forceUpdate});
}
