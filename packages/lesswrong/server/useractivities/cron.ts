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
    SELECT EXTRACT(EPOCH FROM (MIN("endDate") - MIN("startDate"))) / 3600 + 1 AS correct_length
    FROM "UserActivities";
  `);

  await dataDb.none(`
    DELETE FROM "UserActivities"
    WHERE array_length("activityArray", 1) <> $1;
  `, [correctActivityLength.correct_length]);
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
 * Concatenate the new activity array to the existing activity array for each user.
 * The table "UserActivities" has a columns "activityArray", startDate, and endDate. Where the activityArray
 * Represents whether they were active in each hour between startDate and endDate. Given a new array of ActivityFactors:
 * ```
 * interface ActivityFactor {
 *    user_or_client_id: string;
 *    activity_array: number[];
 *  }
 * ```
 * Concatenate (in SQL) the new activity array to the existing activity array for each user. The startDate for the new activity
 * array should be the endDate of the existing activity array, check this and give up if this is not the case. Also keep the total
 * length of the activity array to ACTIVITY_WINDOW_HOURS (which is 28 days, or 672 hours)
 */
async function concatNewActivity(dataDb: SqlClient, activityFactors: ActivityFactor[], startDate: Date, endDate: Date) {
  // Sub-function to handle userId and clientId separately
  async function processActivityFactors(type: 'userId' | 'clientId', activityFactors: ActivityFactor[]) {
    const tempTableValues = activityFactors.map(factor => `('${factor.user_or_client_id}', ARRAY[${factor.activity_array.join(', ')}])`).join(', ');
    const randomIds = activityFactors.map(() => randomId())

    await dataDb.none(`
      -- Create a temporary table for new_activity
      WITH new_activity AS (
        SELECT * FROM (VALUES ${tempTableValues}) AS t(user_id, activity_array)
      ),
      -- Update existing rows in "UserActivities" and return the updated visitorIds
      updated_user_activities AS (
        UPDATE "UserActivities"
        SET
          -- Concatenate new activity array and truncate if longer than ACTIVITY_WINDOW_HOURS
          "activityArray" = (array_cat(new_activity.activity_array, "UserActivities"."activityArray"))[:${ACTIVITY_WINDOW_HOURS}],
          -- Update endDate and adjust startDate based on the length of the new activityArray
          "endDate" = $1,
          "startDate" = $1::timestamp - make_interval(hours := (array_length("activityArray", 1) - 1))
        FROM new_activity
        WHERE
          "UserActivities"."visitorId" = substring(new_activity.user_id, 3)
          AND "UserActivities"."type" = '${type}'
          AND "UserActivities"."endDate" = $2
        RETURNING "UserActivities"."visitorId"
      )
      -- Insert new rows for users not yet in the "UserActivities" table
      INSERT INTO "UserActivities" ("_id", "visitorId", "type", "activityArray", "startDate", "endDate")
      SELECT
        generated_id,
        substring(user_id, 3),
        '${type}',
        activity_array,
        $2,
        $1
      FROM (
        SELECT
          user_id,
          activity_array,
          unnest($3::text[]) as generated_id
        FROM new_activity
      ) new_activity_with_id
      WHERE user_id NOT IN (SELECT "visitorId" FROM updated_user_activities);
    `, [endDate.toISOString(), startDate.toISOString(), activityFactors.map(() => randomId())]);
  }

  // Split activityFactors into two arrays based on userId and clientId
  const userIdActivityFactors = activityFactors.filter(factor => factor.user_or_client_id.startsWith('u:'));
  const clientIdActivityFactors = activityFactors.filter(factor => factor.user_or_client_id.startsWith('c:'));

  // Process userId and clientId activity factors separately
  await processActivityFactors('userId', userIdActivityFactors);
  await processActivityFactors('clientId', clientIdActivityFactors);
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

  // keep all users in sync, and kill rows that have no activity in the past 28 days
  await assertTableIntegrity(dataDb);

  const { startDate, endDate } = await getStartEndDate(dataDb);
  const activityFactors = await getUserActivityFactors(analyticsDb, startDate, endDate);
  
  console.log(`Updating user activity for ${activityFactors.length} users between ${startDate} and ${endDate}`);
  // TODO split into the two cases here
  await concatNewActivity(dataDb, activityFactors, startDate, endDate);
}

addCronJob({
  name: 'updateUserActivitiesCron',
  interval: 'every 2 hours',
  async job() {
    await updateUserActivities();
  }
});

Vulcan.updateUserActivities = updateUserActivities;
