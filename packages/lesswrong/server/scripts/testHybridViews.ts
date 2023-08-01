import { Globals } from "../vulcan-lib";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { HybridView } from "../analytics/hybridViews";
import { getAnalyticsConnectionFromString } from "../analytics/postgresConnection";

const testHybridViews = async () => {
  const connectionString = 'postgresql://postgres:zKHt2DRF5hxMcxhympDp@forum-analytics-debug.cm4g2jxq8i8x.us-east-1.rds.amazonaws.com/forumanalytics'
  const analyticsDb = getAnalyticsConnectionFromString(connectionString)
  if (!analyticsDb) {
    throw new Error("No analytics DB configured");
  }

  // This takes a _really_ long time to run, about 3 hours. Possibly a dealbreaker.
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
    GROUP BY
      post_id,
      date_trunc('day', timestamp)
  `;
  // TODO this one too
  // const readingTimeQuery = (crossoverTime: Date, postId: string) => `
  //     SELECT
  //         client_id,
  //         post_id,
  //         (date_trunc('day', timestamp) + interval '1 second') AS window_start,
  //         (date_trunc('day', timestamp) + interval '1 day') AS window_end,
  //         sum(INCREMENT) AS reading_time
  //     FROM
  //         event_timer_event
  //     WHERE
  //         client_id IS NOT NULL
  //         AND timestamp > '${crossoverTime.toISOString()}'
  //         AND post_id = '${postId}'
  //     GROUP BY
  //         client_id,
  //         post_id,
  //         date_trunc('day', timestamp)
  //     ORDER BY
  //         window_end DESC;
  // `;

  const uniqueIndexGenerator = (viewName: string) => `
    CREATE UNIQUE INDEX "${viewName}_unique_index" ON "${viewName}" (post_id, window_end);
  `;

  const hybridView = new HybridView({
    queryGenerator: viewQuery,
    identifier: "page_views",
    indexQueryGenerators: [uniqueIndexGenerator],
    viewSqlClient: analyticsDb,
  });

  // await hybridView.ensureView();
  // await hybridView.refreshMaterializedView();

  const hvQuery = await hybridView.hybridViewQuery();

  const fullQuery = `
    SELECT
      *
    FROM
      (${hvQuery}) q
    WHERE
      q."documentId" = '5iCsbrSqLyrfP55ry';
  `;
  
  console.log(fullQuery);
  const res = await analyticsDb.any(fullQuery, []);
  console.log({res});
};

Globals.testHybridViews = testHybridViews;
