/* eslint-disable no-console */
/* eslint-disable no-useless-escape */
import { isE2E } from "../../lib/executionEnvironment";
import { getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { backgroundTask } from "../utils/backgroundTask";

// Run the following SQL to check on the progress of this script:
// SELECT
//   pid,
//   now() - pg_stat_activity.query_start AS duration,
//   query,
//   state
// FROM pg_stat_activity order by duration desc;

// Note that this only has data starting from 2022
const USER_ENGAGEMENT_VIEW_NAME = 'user_engagement_wrapped';
const USER_ENGAGEMENT_VIEWDEF = `
WITH normalized AS (
  SELECT
    raw.environment,
    raw."timestamp",
    raw.event ->> 'userId'::text AS user_id,
    raw.event ->> 'path'::text AS path,
    CASE WHEN (raw.event ->> 'increment'::text) ~ '^[0-9\.]+$'::text THEN
      (raw.event ->> 'increment'::text)::numeric
    ELSE
      0::numeric
    END AS increment
  FROM
    raw
  WHERE
    raw.event_type = 'timerEvent'
    AND raw.environment = 'production' -- Comment out if running on dev db
    -- DEBUG: Uncomment below to run over a shorter time period for faster testing
    -- AND raw."timestamp" >= '2023-12-01 00:00:00'::timestamp WITHOUT time zone
    AND raw."timestamp" >= '2022-01-01 00:00:00'::timestamp WITHOUT time zone
),
by_date AS (
  SELECT
    normalized.user_id,
    sum(normalized.increment) AS sum_increment,
    normalized."timestamp"::date AS view_date
  FROM
    normalized
  GROUP BY
    normalized.user_id,
    (normalized."timestamp"::date))
SELECT
  date_part('year', by_date.view_date) AS view_year,
  by_date.user_id,
  view_date,
  sum(by_date.sum_increment) AS total_seconds
FROM
  by_date
GROUP BY
  by_date.user_id,
  by_date.view_date;
`;

// Exported to allow running with "yarn repl"
export const triggerWrappedRefresh = async (recreateViews = false) => {
  // Analytics DB is not available in e2e tests
  if (isE2E) {
    return [];
  }

  const analyticsDb = getAnalyticsConnectionOrThrow();

  // Check if the view already exists
  console.log(`Checking if view ${USER_ENGAGEMENT_VIEW_NAME} exists...`);
  const viewExists = await analyticsDb.oneOrNone(`SELECT to_regclass('${USER_ENGAGEMENT_VIEW_NAME}');`);

  if (viewExists.to_regclass === USER_ENGAGEMENT_VIEW_NAME) {
    if (!recreateViews) {
      console.log(`Triggering a refresh for ${USER_ENGAGEMENT_VIEW_NAME}...`);
      backgroundTask(analyticsDb.none(`REFRESH MATERIALIZED VIEW ${USER_ENGAGEMENT_VIEW_NAME};`));
    } else {
      console.log(`Dropping and recreating ${USER_ENGAGEMENT_VIEW_NAME}...`);
      await analyticsDb.none(`DROP MATERIALIZED VIEW ${USER_ENGAGEMENT_VIEW_NAME};`);
      backgroundTask(analyticsDb.none(`CREATE MATERIALIZED VIEW ${USER_ENGAGEMENT_VIEW_NAME} AS ${USER_ENGAGEMENT_VIEWDEF};`));
    }
  } else {
    // If it doesn't, create the view
    console.log(`View ${USER_ENGAGEMENT_VIEW_NAME} does not exist. Creating the view...`);
    await analyticsDb.none(`CREATE MATERIALIZED VIEW ${USER_ENGAGEMENT_VIEW_NAME} AS ${USER_ENGAGEMENT_VIEWDEF};`);
  }
}
