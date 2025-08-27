/* See lib/collections/useractivities/collection.ts for a high-level overview */
import { forumSelect } from "../../lib/forumTypeUtils";
import { getAnalyticsConnection } from "../analytics/postgresConnection";
import { environmentDescriptionSetting } from '@/lib/instanceSettings';

export interface ActivityWindowData {
  userOrClientId: string;
  activityArray: number[];
}

/*
 * When running this script locally we want it to use the real analytics events
 */
const getLiveEnvDescriptions = () => forumSelect<Record<string, string>>({
  EAForum: {
    "production": 'production',
    "staging": 'staging',
    "dev": 'development',
    "local-dev-prod-db": 'production', // prod running locally
    "local-dev-staging-db": 'staging', // staging running locally
  },
  LessWrong: {
    "lesswrong.com": 'lesswrong.com',
    "dev": 'development',
    // this setting applies to localhost running against prod db – set to 'lesswrong.com' to use analytics events produced in prod, 
    // or 'development' to use events produced when a server is running locally
    "local-dev-prod-db": 'lesswrong.com', 
  },
  default: {
    "production": 'production',
    "staging": 'staging',
    "dev": 'development',
    "local-dev-prod-db": 'production', // prod running locally
    "local-dev-staging-db": 'staging', // staging running locally
  }
})

/**
 * Get an array of ActivityWindowData, one for each user or client that was active between startDate and endDate.
 *
 * In the typical case, this will be called with start date of 22 days ago (to the hour) and an end date of 24 hours ago.
 */
export async function getUserActivityData(
  startDate: Date,
  endDate: Date
): Promise<ActivityWindowData[]> {
  const analyticsDb = await getAnalyticsConnection();
  if (!analyticsDb) {
    throw new Error('Analytics database not available');
  }
  // startDate and endDate must be exact hours
  if (startDate.getMinutes() !== 0 || startDate.getSeconds() !== 0) {
    throw new Error('startDate must be an exact hour');
  }
  if (endDate.getMinutes() !== 0 || endDate.getSeconds() !== 0) {
    throw new Error('endDate must be an exact hour');
  }
  if (startDate === endDate) {
    return [];
  }
  if (startDate > endDate) {
    throw new Error('startDate must be before endDate');
  }
  const liveEnvDescription = getLiveEnvDescriptions()[environmentDescriptionSetting.get()]
  if (!liveEnvDescription) {
    throw new Error(`Unknown environmentDescriptionSetting: ${environmentDescriptionSetting.get()}`);
  }
  
  const activityAnalyticsSql = `
    WITH hourly_activity AS (
      SELECT
          CASE
            WHEN event->>'userId' IS NOT NULL THEN 'u:' || (event->>'userId')
            ELSE 'c:' || (event->>'clientId')
          END AS "userOrClientId",
          date_trunc('hour', timestamp) AS hour,
          COUNT(*) AS events
      FROM public.raw
      WHERE environment = '${liveEnvDescription}'
        AND event_type = 'timerEvent'
        AND (event->>'userId' IS NOT NULL OR event->>'clientId' IS NOT NULL)
        AND timestamp >= $1
        AND timestamp < $2
      GROUP BY "userOrClientId", hour
    ),
    user_hours AS (
      SELECT DISTINCT
        "userOrClientId",
        generate_series(
            date_trunc('hour', $1::timestamp),
            date_trunc('hour', $2::timestamp) - interval '1 hour', -- subtract 1 hour to avoid including the end hour
            interval '1 hour'
        ) AS hour
      FROM hourly_activity
    ),
    user_hourly_activity AS (
      SELECT
          uh."userOrClientId",
          uh.hour,
          CASE WHEN ha.events IS NULL THEN 0 ELSE 1 END AS activity
      FROM user_hours uh
      LEFT JOIN hourly_activity ha ON uh."userOrClientId" = ha."userOrClientId" AND uh.hour = ha.hour
    )
    SELECT
      "userOrClientId",
      array_agg(activity ORDER BY hour DESC) AS "activityArray"
    FROM user_hourly_activity
    GROUP BY "userOrClientId";
  `

  // Get an array by the hour of whether a user was active between startDate and endDate
  // e.g. with startDate = 2020-01-01T00:00:00Z and endDate = 2020-01-02T00:00:00Z, the result might be:
  // user_id, "activityArray"
  // u:cKttArH2Bok7B9zeT, {0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,1,0,0,0}
  // c:22g4uu6JdjYMBcvtm, {0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0}
  //                                                      ^ this indicates they were active around 2020-01-01T13:00:00Z
  const result = await analyticsDb.any<ActivityWindowData>(activityAnalyticsSql, [startDate.toISOString(), endDate.toISOString()]);

  return result;
}
