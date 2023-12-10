/* eslint-disable no-console */
/* eslint-disable no-useless-escape */
import { getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { Globals } from "../vulcan-lib";

const USER_ENGAGEMENT_VIEW_NAME = 'user_engagement_wrapped_2023';
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
    AND raw.environment = 'production'
    AND raw."timestamp" >= '2023-12-01 00:00:00'::timestamp WITHOUT time zone
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

const triggerWrappedRefresh = async (recreateViews = false) => {
  const analyticsDb = getAnalyticsConnectionOrThrow();

  // Check if the view already exists
  console.log(`Checking if view ${USER_ENGAGEMENT_VIEW_NAME} exists...`);
  const viewExists = await analyticsDb.oneOrNone(`SELECT to_regclass('${USER_ENGAGEMENT_VIEW_NAME}');`);

  if (viewExists.to_regclass === USER_ENGAGEMENT_VIEW_NAME) {
    if (!recreateViews) {
      console.log(`Triggering a refresh for ${USER_ENGAGEMENT_VIEW_NAME}...`);
      void analyticsDb.none(`REFRESH MATERIALIZED VIEW ${USER_ENGAGEMENT_VIEW_NAME};`);
    } else {
      console.log(`Dropping and recreating ${USER_ENGAGEMENT_VIEW_NAME}...`);
      await analyticsDb.none(`DROP MATERIALIZED VIEW ${USER_ENGAGEMENT_VIEW_NAME};`);
      void analyticsDb.none(`CREATE MATERIALIZED VIEW ${USER_ENGAGEMENT_VIEW_NAME} AS ${USER_ENGAGEMENT_VIEWDEF};`);
    }
  } else {
    // If it doesn't, create the view
    console.log(`View ${USER_ENGAGEMENT_VIEW_NAME} does not exist. Creating the view...`);
    await analyticsDb.none(`CREATE MATERIALIZED VIEW ${USER_ENGAGEMENT_VIEW_NAME} AS ${USER_ENGAGEMENT_VIEWDEF};`);
  }
}

Globals.triggerWrappedRefresh = triggerWrappedRefresh;
