import { IDatabase } from 'pg-promise';
import { randomId } from '../../lib/random';
import { getSqlClientOrThrow } from '../../lib/sql/sqlClient';
import { getAnalyticsConnection } from '../analytics/postgresConnection';
import { addCronJob } from '../cronUtil';
import { Vulcan } from '../vulcan-lib';

const ACTIVITY_WINDOW_HOURS = 28 * 24;

interface ActivityFactor {
  user_or_client_id: string;
  activity_array: number[];
}

const activityAnalyticsSql = `
WITH hourly_activity AS (
  SELECT
      CASE
        WHEN event->>'userId' IS NOT NULL THEN 'u:' || (event->>'userId')
        ELSE 'c:' || (event->>'clientId')
      END AS user_or_client_id,
      date_trunc('hour', timestamp) AS hour,
      COUNT(*) AS events
  FROM public.raw
  WHERE environment = 'development' -- TODO match to active env
    AND event_type = 'timerEvent'
    AND (event->>'userId' IS NOT NULL OR event->>'clientId' IS NOT NULL)
    AND timestamp >= $1
    AND timestamp < $2
  GROUP BY user_or_client_id, hour
),
user_hours AS (
  SELECT DISTINCT
      user_or_client_id,
      generate_series(
          date_trunc('hour', $1::timestamp),
          date_trunc('hour', $2::timestamp),
          interval '1 hour'
      ) AS hour
  FROM hourly_activity
),
user_hourly_activity AS (
  SELECT
      uh.user_or_client_id,
      uh.hour,
      CASE WHEN ha.events IS NULL THEN 0 ELSE 1 END AS activity
  FROM user_hours uh
  LEFT JOIN hourly_activity ha ON uh.user_or_client_id = ha.user_or_client_id AND uh.hour = ha.hour
)
SELECT
  user_or_client_id,
  array_agg(activity ORDER BY hour DESC) AS activity_array
FROM user_hourly_activity
GROUP BY user_or_client_id;
`

async function getUserActivityFactors(
  analyticsDb: IDatabase<{}>,
  startDate: Date,
  endDate: Date
): Promise<ActivityFactor[]> {
  // startDate and endDate must be exact hours
  if (startDate.getMinutes() !== 0 || startDate.getSeconds() !== 0) {
    throw new Error('startDate must be an exact hour');
  }
  if (endDate.getMinutes() !== 0 || endDate.getSeconds() !== 0) {
    throw new Error('endDate must be an exact hour');
  }

  // Get an array by the hour of whether a user was active between startDate and endDate
  // e.g. with startDate = 2020-01-01T00:00:00Z and endDate = 2020-01-02T00:00:00Z, the result might be:
  // user_id, activity_array
  // u:cKttArH2Bok7B9zeT, {0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,1,0,0,0}
  // c:22g4uu6JdjYMBcvtm, {0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0}
  //                                                      ^ this indicates they were active around 2020-01-01T13:00:00Z
  const result = await analyticsDb.any<ActivityFactor>(activityAnalyticsSql, [startDate.toISOString(), endDate.toISOString()]);
  const testRes = await analyticsDb.any("SELECT * FROM raw limit 1;")

  return result;
}


/**
 * The UserActivities table has a startDate, an endDate, and an array of activity. Where there
 * should be an array element for every hour between the start and end date. Additionally, the
 * startDate and endDate should actually be the same for every row (this is an "implementation detail").
 *
 * Assert that all of these things are true, and if not, drop the smallest number of rows necessary to
 * make them true. Dropping a row only means a user/clientId will be treated as having no activity, which is
 * not a big deal.
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

  await dataDb.none(`
    DELETE FROM "UserActivities"
    WHERE array_length("activityArray", 1) <> $1;
  `, [correctActivityLengthInt]);
}

/**
 * Get the start and end date for the next user activity update. startDate will be the end date of the
 * most recent row in the UserActivities table, or 7 days ago if there are no rows. endDate will be the current time, minus an hour.
 * Both of these dates will be rounded down to the nearest hour.
 */
async function getStartEndDate(dataDb: SqlClient) {
  const { result } = await dataDb.one(`
    SELECT MAX("endDate") AS last_end_date
    FROM "UserActivities";
  `);

  const now = new Date();
  const fallbackStartDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const lastEndDate = result?.[0] ? new Date(result[0]) : fallbackStartDate;
  
  // Round down lastEndDate to the nearest hour
  lastEndDate.setMinutes(0, 0, 0);

  // endDate is now, minus an hour, rounded down to the nearest hour
  const endDate = new Date(now.getTime());
  endDate.setHours(endDate.getHours() - 1, 0, 0, 0);

  return {
    startDate: lastEndDate,
    endDate: endDate,
  };
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
async function concatNewActivity(dataDb: SqlClient, activityFactors: ActivityFactor[], newActivityStartDate: Date, newActivityEndDate: Date, visitorIdType: 'userId' | 'clientId') {
  // Concatenate the new activity array to the existing activity array for each
  // user. The table "UserActivities" has a columns "activityArray", startDate,
  // and endDate. Where the activityArray Represents whether they were active in
  // each hour between newActivityStartDate and newActivityEndDate. Given a new
  // array of ActivityFactors:
  // ```
  // interface ActivityFactor {
  //    user_or_client_id: string;
  //    activity_array: number[];
  //  }
  // ```
  // The startDate for the new activity array should be the endDate of the
  // existing activity array, check this and give up if this is not the case.
  // Also keep the total length of the activity array to ACTIVITY_WINDOW_HOURS
  // (which is 28 days, or 672 hours)
  const existingUserIds = (await dataDb.any(`
    SELECT "visitorId" FROM "UserActivities" where "type" = '${visitorIdType}';
  `)).map(({ visitorId }) => visitorId);
  const paddedStartDate = new Date(newActivityEndDate.getTime() - ACTIVITY_WINDOW_HOURS * 60 * 60 * 1000);
  
  // First case: Add rows for users who are newly active (zero padding the end)
  // Get all the existing users or clients in the UserActivities table

  // Prepare the new user data to be inserted in the UserActivities table
  const newUsersData = activityFactors
    .filter(({ user_or_client_id }) => !existingUserIds.includes(user_or_client_id))
    .map(({ user_or_client_id, activity_array }) => {
      const paddedArray = [...activity_array, ...Array(ACTIVITY_WINDOW_HOURS - activity_array.length).fill(0)];
      return { user_or_client_id, paddedArray };
    });

  // Insert the new user data in a single query
  if (newUsersData.length > 0) {
    const placeholders = newUsersData.map((_, index) => `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5}, '${visitorIdType}')`).join(', ');
    const insertQuery = `
      INSERT INTO "UserActivities" ("_id", "visitorId", "activityArray", "startDate", "endDate", "type")
      VALUES ${placeholders}
    `;
    const queryParams = newUsersData.flatMap(({ user_or_client_id, paddedArray }) => {
      return [randomId(), user_or_client_id, paddedArray, paddedStartDate.toISOString(), newActivityEndDate.toISOString()];
    });
    await dataDb.none(insertQuery, queryParams);
  }

  
  // Second case: Append the new activity to users' rows who were previously active
  const existingUsersData = activityFactors.filter(({ user_or_client_id }) => existingUserIds.includes(user_or_client_id));
  if (existingUsersData.length > 0) {
    const tempTableValues = existingUsersData.map(({ user_or_client_id, activity_array }) => `('${user_or_client_id}', ARRAY[${activity_array.join(', ')}])`).join(', ');
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

  // Third case: Add zeros for the relevant number of hours to start of the rows
  // for users who were previously active but have no new activity (i.e. they
  // have existing rows in the table)
  const inactiveExistingUserIds = existingUserIds.filter(id => !existingUsersData.some(({ user_or_client_id }) => user_or_client_id === id));
  if (inactiveExistingUserIds.length > 0) {
    const newActivityHours = Math.ceil((newActivityEndDate.getTime() - newActivityStartDate.getTime()) / (1000 * 60 * 60));
    const updateQuery = `
      UPDATE "UserActivities"
      SET
        "activityArray" = (array_cat(ARRAY[${Array(newActivityHours).fill(0).join(', ')}], "UserActivities"."activityArray"))[:${ACTIVITY_WINDOW_HOURS}],
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

async function updateUserActivities() {
  // update the "unadjusted activity arrays of all users"
  // unfortunately this will probably require pulling out every row
  
  // get prod db connection
  const dataDb = await getSqlClientOrThrow();
  const analyticsDb = await getAnalyticsConnection();
  if (!dataDb || !analyticsDb) {
    throw new Error("updateUserActivities: couldn't get database connection");
  };

  // keep all users in sync
  await assertTableIntegrity(dataDb);

  const { startDate, endDate } = await getStartEndDate(dataDb);
  const activityFactors = await getUserActivityFactors(analyticsDb, startDate, endDate);
  
  // eslint-disable-next-line no-console
  console.log(`Updating user activity for ${activityFactors.length} users between ${startDate} and ${endDate}`);
  // TODO split into the two cases here, , and kill rows that have no activity in the past 28 days
  const userActivityFactors = activityFactors
    .filter(factor => {
      return factor.user_or_client_id.startsWith('u:');
    })
    .map(factor => ({...factor, user_or_client_id: factor.user_or_client_id.slice(2)}));
  const clientActivityFactors = activityFactors
    .filter(factor => factor.user_or_client_id.startsWith('c:'))
    .map(factor => ({...factor, user_or_client_id: factor.user_or_client_id.slice(2)}));
  await concatNewActivity(dataDb, userActivityFactors, startDate, endDate, 'userId');
  await concatNewActivity(dataDb, clientActivityFactors, startDate, endDate, 'clientId');
}

addCronJob({
  name: 'updateUserActivitiesCron',
  interval: 'every 2 hours',
  async job() {
    await updateUserActivities();
  }
});

Vulcan.updateUserActivities = updateUserActivities;
