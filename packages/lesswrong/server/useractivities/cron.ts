import { chunk, max, some } from 'lodash/fp';
import { randomId } from '../../lib/random';
import { getSqlClientOrThrow } from '../../lib/sql/sqlClient';
import { addCronJob } from '../cronUtil';
import { Vulcan } from '../vulcan-lib';
import { ActivityFactor, getUserActivityFactors } from './getUserActivityFactors';

const ACTIVITY_WINDOW_HOURS = 28 * 24;

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  while (array.length) {
    results.push(array.splice(0, chunkSize));
  }
  return results;
}

/**
 * Assert that all the activityArrays in the UserActivities table are the correct (and identical) length,
 * and have the correct start and end dates. Drop any rows that are inconsistent.
 *
 * In practice this should never do anything, but it will stop the data getting badly out of sync if
 * something goes wrong.
 */
async function assertTableIntegrity(dataDb: SqlClient) {
  // Step 1: Check if all rows have the same startDate and endDate
  const dateCheckResult = await dataDb.one(`
    SELECT COUNT(DISTINCT "startDate") AS start_count, COUNT(DISTINCT "endDate") AS end_count
    FROM "UserActivities";
  `);

  if (dateCheckResult.start_count > 1 || dateCheckResult.end_count > 1) {
    // eslint-disable-next-line no-console
    console.error('UserActivities table has rows with different start and end dates. Dropping rows to fix this.');

    // Delete rows with different startDate and endDate
    await dataDb.none(`
      DELETE FROM "UserActivities"
      WHERE "startDate" <> (SELECT MIN("startDate") FROM "UserActivities")
         OR "endDate" <> (SELECT MIN("endDate") FROM "UserActivities");
    `);
  }

  // Step 2: Check if the array of activity has the correct length for each row
  const correctActivityLength = await dataDb.one(`
    SELECT EXTRACT(EPOCH FROM (MIN("endDate") - MIN("startDate"))) / 3600 AS correct_length
    FROM "UserActivities";
  `);
  const correctActivityLengthInt = parseInt(correctActivityLength.correct_length);
  
  if (!correctActivityLengthInt) return

  // Delete rows with an array of activity that is the wrong length
  await dataDb.none(`
    DELETE FROM "UserActivities"
    WHERE array_length("activityArray", 1) <> $1;
  `, [correctActivityLengthInt]);
}

/**
 * Get the start and end date for the next user activity update. startDate will be the end date of the
 * current rows in the UserActivities table, or 7 days ago if there are no rows. endDate will be the current time, minus an hour.
 * Both of these dates will be rounded down to the nearest hour.
 */
async function getStartEndDate(dataDb: SqlClient) {
  const { last_end_date, last_start_date } = await dataDb.one(`
    SELECT MAX("endDate") AS last_end_date, MIN("startDate") AS last_start_date
    FROM "UserActivities";
  `);

  const now = new Date();
  const fallbackStartDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const lastEndDate = last_end_date ? new Date(last_end_date) : fallbackStartDate;
  const oldStartDate = last_start_date ? new Date(last_start_date) : undefined;
  
  // Round down lastEndDate to the nearest hour
  lastEndDate.setMinutes(0, 0, 0);

  // endDate is now, minus an hour, rounded down to the nearest hour
  const endDate = new Date(now.getTime());
  endDate.setHours(endDate.getHours() - 1, 0, 0, 0);

  return {
    oldStartDate: oldStartDate,
    startDate: lastEndDate,
    endDate: endDate,
  };
}

interface ConcatNewActivityParams {
  dataDb: SqlClient;
  activityFactors: ActivityFactor[];
  oldActivityStartDate: Date;
  newActivityStartDate: Date;
  newActivityEndDate: Date;
  visitorIdType: 'userId' | 'clientId';
}

/**
 * Update UserActivities table with new activity data
 *
 * After this function is run:
 *  - Every user user who was active in last ACTIVITY_WINDOW_HOURS (28 days)
 *    will have an array of activity representing their activity in each hour.
 *    All of these arrays will be the same length (i.e. we zero-pad as necessary)
 *  - Rows from inactive users will be deleted
 */
async function concatNewActivity({dataDb, activityFactors, oldActivityStartDate, newActivityStartDate, newActivityEndDate, visitorIdType}: ConcatNewActivityParams) {
  // remove activityFactors with userOrClientId that is not 17 chars (userId and clientId stored verbatim from the event, which means people can insert fake values)
  const cleanedActivityFactors = activityFactors.filter(({userOrClientId}) => userOrClientId.length === 17)

  // Get the existing user IDs from the UserActivities table, required to distinguish between newly active users and existing users
  const existingUserIds = (await dataDb.any(`
    SELECT "visitorId" FROM "UserActivities" where "type" = '${visitorIdType}';
  `)).map(({ visitorId }) => visitorId);
  // Go back to the start of the activity window, up to a maximum of ACTIVITY_WINDOW_HOURS in the past
  const paddedStartDate = max([oldActivityStartDate, new Date(newActivityEndDate.getTime() - (ACTIVITY_WINDOW_HOURS * 60 * 60 * 1000))]) ?? oldActivityStartDate;
  
  // First case: Add rows for users who are newly active (zero padding the end as necessary)

  // Prepare the new user data to be inserted in the UserActivities table
  const newUsersData = cleanedActivityFactors
    .filter(({ userOrClientId }) => !existingUserIds.includes(userOrClientId))
    .map(({ userOrClientId, activityArray: activity_array }) => {
      // paddedArray should be [...activity_array], plus zero padding going back to paddedStartDate:
      const zeroPaddingLength = Math.floor((newActivityEndDate.getTime() - paddedStartDate.getTime()) / (60 * 60 * 1000)) - activity_array.length
      const zeroPadding = Array(zeroPaddingLength).fill(0);
      const paddedArray = [...activity_array, ...zeroPadding];
      return { userOrClientId, paddedArray };
    });

  // Insert the new user data in a single query
  if (newUsersData.length > 0) {
    console.log(`Inserting ${newUsersData.length} new rows into UserActivities table`)
    // if (newUsersData.some(({ userOrClientId, paddedArray }) => userOrClientId.length > 27)) {
    //   console.error('User ID or client ID is too long. This will cause an error when inserting into the database. Skipping this step.')
    // }
    const placeholders = newUsersData.map((_, index) => `($${(index * 5) + 1}, $${(index * 5) + 2}, $${(index * 5) + 3}, $${(index * 5) + 4}, $${(index * 5) + 5}, '${visitorIdType}')`).join(', ');
    const insertQuery = `
      INSERT INTO "UserActivities" ("_id", "visitorId", "activityArray", "startDate", "endDate", "type")
      VALUES ${placeholders}
    `;
    const queryParams = newUsersData.flatMap(({ userOrClientId, paddedArray }) => {
      return [randomId(), userOrClientId, paddedArray, paddedStartDate.toISOString(), newActivityEndDate.toISOString()];
    });
    await dataDb.none(insertQuery, queryParams);
  }

  // Second case: Append the new activity to users' rows who were previously active.
  // Note the truncation ([:${ACTIVITY_WINDOW_HOURS}]) to ensure that the array of activity is the correct length
  const existingUsersData = cleanedActivityFactors.filter(({ userOrClientId }) => existingUserIds.includes(userOrClientId));
  if (existingUsersData.length > 0) {
    const tempTableValues = existingUsersData.map(({ userOrClientId, activityArray: activity_array }) => `('${userOrClientId}', ARRAY[${activity_array.join(', ')}])`).join(', ');
    const updateQuery = `
      WITH new_activity AS (
        SELECT * FROM (VALUES ${tempTableValues}) AS t(user_id, activity_array)
      )
      UPDATE "UserActivities"
      SET
        "activityArray" = (array_cat(new_activity.activity_array, "UserActivities"."activityArray"))[:${ACTIVITY_WINDOW_HOURS}],
        "startDate" = $1,
        "endDate" = $2
      FROM new_activity
      WHERE
        "UserActivities"."visitorId" = new_activity.user_id
        AND "UserActivities"."type" = '${visitorIdType}';
    `;
    await dataDb.none(updateQuery, [paddedStartDate.toISOString(), newActivityEndDate.toISOString()]);
  }

  // Third case: Zero-pad the start of rows for users who were previously active but have no new activity
  // (i.e. they have existing rows in the table but have not been active since we last updated the table)
  const inactiveExistingUserIds = existingUserIds.filter(id => !existingUsersData.some(({ userOrClientId }) => userOrClientId === id));
  if (inactiveExistingUserIds.length > 0) {
    const newActivityHours = Math.ceil((newActivityEndDate.getTime() - newActivityStartDate.getTime()) / (1000 * 60 * 60));
    const updateQuery = `
      UPDATE "UserActivities"
      SET
        "activityArray" = (array_cat(ARRAY[${Array(newActivityHours).fill(0).join(', ')}]::double precision[], "UserActivities"."activityArray"))[:${ACTIVITY_WINDOW_HOURS}],
        "startDate" = $1,
        "endDate" = $2
      WHERE
        "UserActivities"."visitorId" IN (${inactiveExistingUserIds.map((_, index) => `$${index + 3}`).join(', ')})
        AND "UserActivities"."type" = '${visitorIdType}';
    `;
    const queryParams = [paddedStartDate.toISOString(), newActivityEndDate.toISOString(), ...inactiveExistingUserIds];
    await dataDb.none(updateQuery, queryParams);
  }

  // Fourth case: Every user has had their activity updated now. Remove rows for users who are no longer active in the last
  // ACTIVITY_WINDOW_HOURS (i.e. the activity array is all zeros)
  const deleteQuery = `
    DELETE FROM "UserActivities"
    WHERE
      "UserActivities"."type" = '${visitorIdType}'
      AND array_position("UserActivities"."activityArray", 1) IS NULL; -- no "1" in the array
  `;
  await dataDb.none(deleteQuery);
}

/**
 * Wrapper around concatNewActivity that batches the activityFactors array into smaller chunks,
 * to avoid hitting the query parameter limit (~10000)
 */
async function batchedConcatNewActivity({activityFactors, ...otherProps}: ConcatNewActivityParams) {
  const batchSize = 1000;
  const batches = chunk(batchSize, activityFactors);
  
  for (const batch of batches) {
    await concatNewActivity({activityFactors: batch, ...otherProps});
  }
}

/**
 * Update the UserActivities table with the latest activity data from the analytics database
 */
export async function updateUserActivities(props?: {startDate?: Date, endDate?: Date}) {
  const dataDb = await getSqlClientOrThrow();
  if (!dataDb) {
    throw new Error("updateUserActivities: couldn't get database connection");
  };

  await assertTableIntegrity(dataDb);
  // TODO rename startDate and endDate to be clearer
  const { oldStartDate, startDate, endDate } = {...(await getStartEndDate(dataDb)), ...props};

  // Get the most recent activity data from the analytics database
  const activityFactors = await getUserActivityFactors(startDate, endDate);
  
  // eslint-disable-next-line no-console
  console.log(`Updating user activity for ${activityFactors.length} users between ${startDate} and ${endDate}`);

  const userActivityFactors = activityFactors
    .filter(factor => {
      return factor.userOrClientId?.startsWith('u:');
    })
    .map(factor => ({...factor, userOrClientId: factor.userOrClientId.slice(2)}));
  const clientActivityFactors = activityFactors
    .filter(factor => factor.userOrClientId?.startsWith('c:'))
    .map(factor => ({...factor, userOrClientId: factor.userOrClientId.slice(2)}));

  // Update the UserActivities table with the new activity data
  await batchedConcatNewActivity({dataDb, activityFactors: userActivityFactors, oldActivityStartDate: oldStartDate ?? startDate, newActivityStartDate: startDate, newActivityEndDate: endDate, visitorIdType: 'userId'});
  await batchedConcatNewActivity({dataDb, activityFactors: clientActivityFactors, oldActivityStartDate: oldStartDate ?? startDate, newActivityStartDate: startDate, newActivityEndDate: endDate, visitorIdType: 'clientId'});
}

export async function backfillUserActivities() {
  const dataDb = await getSqlClientOrThrow();
  if (!dataDb) {
    throw new Error("updateUserActivities: couldn't get database connection");
  };

  // Clear the current data in the UserActivities collection
  // If we do this while this is live it means there will be a period of time where everyone
  // is considered to be inactive. We're not planning to run this while the activity factor logic is
  // live, and this wouldn't be that bad anyway.
  await dataDb.none(`DELETE FROM "UserActivities";`);

  // Get the current date and time (rounded down to the hour)
  const now = new Date();
  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);

  // Calculate the starting date for the backfill (ACTIVITY_WINDOW_HOURS ago)
  const startDate = new Date(now);
  startDate.setHours(startDate.getHours() - ACTIVITY_WINDOW_HOURS);

  // Loop over the range of dates in 1-day increments
  for (let currentDate = startDate; currentDate <= now; currentDate.setHours(currentDate.getHours() + 24)) {
    const endDate = new Date(currentDate);
    endDate.setHours(endDate.getHours() + 24);

    // Update the UserActivities table with the activity data for the current date range
    await updateUserActivities({ startDate: currentDate, endDate });
  }
}

addCronJob({
  name: 'updateUserActivitiesCron',
  interval: 'every 2 hours',
  async job() {
    await updateUserActivities();
  }
});

Vulcan.updateUserActivities = updateUserActivities;
Vulcan.backfillUserActivities = backfillUserActivities;
