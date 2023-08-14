import { registerHybridAnalyticsView } from "./hybridViews";

export const POST_VIEWS_IDENTIFIER = "post_views";

const viewQuery = (crossoverTime: Date, materialized = false) => `
    SELECT
      count(*) AS view_count,
      post_id,
      (date_trunc('day', timestamp) + interval '1 second') AS window_start,
      (date_trunc('day', timestamp) + interval '1 day') AS window_end
    FROM
      page_view
    WHERE
      timestamp > '${crossoverTime.toISOString()}'
      ${materialized ? 'AND timestamp < NOW()' : ''}
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

const postIndexGenerator = (viewName: string) => `
  CREATE INDEX IF NOT EXISTS "${viewName}_post_index" ON "${viewName}" (post_id);
`;

registerHybridAnalyticsView({
  identifier: POST_VIEWS_IDENTIFIER,
  queryGenerator: viewQuery,
  indexQueryGenerators: [uniqueIndexGenerator, timeIndexGenerator, postIndexGenerator],
});
