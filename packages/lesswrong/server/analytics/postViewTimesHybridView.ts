import { registerHybridAnalyticsView } from "./hybridViews";

export const POST_VIEW_TIMES_IDENTIFIER = "post_view_times";

const viewQuery = (crossoverTime: Date, materialized = false) => `
  SELECT
    client_id,
    post_id,
    (date_trunc('day', timestamp) + interval '1 second') AS window_start,
    (date_trunc('day', timestamp) + interval '1 day') AS window_end,
    sum(INCREMENT) AS reading_time
  FROM
    event_timer_event
  WHERE
    client_id IS NOT NULL
    AND timestamp > '${crossoverTime.toISOString()}'
    ${materialized ? 'AND timestamp < NOW()' : ''}
  GROUP BY
    client_id,
    post_id,
    date_trunc('day', timestamp)
`;

const uniqueIndexGenerator = (viewName: string) => `
  CREATE UNIQUE INDEX IF NOT EXISTS "${viewName}_unique_index" ON "${viewName}" (client_id, post_id, window_end);
`;

const timeIndexGenerator = (viewName: string) => `
  CREATE INDEX IF NOT EXISTS "${viewName}_time_index" ON "${viewName}" (window_end);
`;

const postIndexGenerator = (viewName: string) => `
  CREATE INDEX IF NOT EXISTS "${viewName}_post_index" ON "${viewName}" (post_id);
`;

registerHybridAnalyticsView({
  identifier: POST_VIEW_TIMES_IDENTIFIER,
  queryGenerator: viewQuery,
  indexQueryGenerators: [uniqueIndexGenerator, timeIndexGenerator, postIndexGenerator],
});
