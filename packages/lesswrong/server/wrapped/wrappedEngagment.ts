import { getAnalyticsConnection } from "@/server/analytics/postgresConnection";

/*
 * Note: this just returns the values from a materialized view that never
 * automatically refreshes so the code for the materialized view will need to
 * be changed if we do this in future years.
*/
export const getWrappedEngagement = async (userId: string, year: number): Promise<{
  totalSeconds: number;
  daysVisited: string[];
  engagementPercentile: number;
}> => {
  const postgres = getAnalyticsConnection();
  if (!postgres) {
    // eslint-disable-next-line no-console
    console.warn("No analytics connection found");
    return {
      totalSeconds: 0,
      daysVisited: [],
      engagementPercentile: 0,
    };
  }

  const totalQuery = `
    WITH by_year AS (
      SELECT
        view_year,
        sum(total_seconds) AS total_seconds,
        user_id
      FROM
        user_engagement_wrapped
      WHERE view_year = $2 AND user_id IS NOT NULL
      GROUP BY view_year, user_id
    ),
    ranked AS (
      SELECT
        user_id,
        total_seconds,
        percent_rank() OVER (ORDER BY total_seconds ASC) engagementPercentile
      FROM by_year
      -- semi-arbitrarily exclude users with less than 3600 seconds (1 hour)
      -- from the ranking
      WHERE total_seconds > 3600
    )
    SELECT
      user_id,
      by_year.total_seconds,
      coalesce(engagementPercentile, 0) engagementPercentile
    FROM
      by_year
      LEFT JOIN ranked USING (user_id)
    WHERE
      user_id = $1;
  `;

  const daysActiveQuery = `
    SELECT view_date::text
    FROM user_engagement_wrapped
    WHERE view_year = $2 AND user_id = $1
    ORDER BY view_date ASC;
  `;

  const [totalResult, daysActiveResult] = await Promise.all([
    postgres.query(totalQuery, [userId, year]),
    postgres.query(daysActiveQuery, [userId, year])
  ]);

  const totalSeconds = totalResult?.[0]?.["total_seconds"] ?? 0;
  const engagementPercentile = totalResult?.[0]?.["engagementpercentile"] ?? 0;

  const daysVisited: string[] = daysActiveResult?.map(
    (result: any) => result["view_date"],
  ) ?? [];

  return {
    totalSeconds,
    daysVisited,
    engagementPercentile,
  };
}
