import { registerHybridAnalyticsView } from "./hybridViews";

const viewQuery = (crossoverTime: Date) => `
    SELECT
      count(*) AS view_count,
      post_id,
      (date_trunc('day', timestamp) + interval '1 second') AS window_start,
      (date_trunc('day', timestamp) + interval '1 day') AS window_end
    FROM
      page_view
    WHERE
      timestamp > '${crossoverTime.toISOString()}'
      AND timestamp < NOW()
    GROUP BY
      post_id,
      date_trunc('day', timestamp)
`;

const uniqueIndexGenerator = (viewName: string) => `
  CREATE UNIQUE INDEX IF NOT EXISTS "${viewName}_unique_index" ON "${viewName}" (post_id, window_end);
`;

const timeIndexGenerator = (viewName: string) => `
  CREATE INDEX IF NOT EXISTS "${viewName}_time_index" ON "${viewName}" (window_end);
`;

registerHybridAnalyticsView({
  identifier: "page_views",
  queryGenerator: viewQuery,
  indexQueryGenerators: [uniqueIndexGenerator, timeIndexGenerator],
});
