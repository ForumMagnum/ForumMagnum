import { Globals } from "../vulcan-lib";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { HybridView } from "../analytics/hybridViews";

const testHybridViews = async () => {
  const viewQuery = (crossoverTime: Date) => `
    SELECT
      SUM(v.power),
      "documentId",
      "collectionName",
      (date_trunc('day', v."createdAt") + interval '1 second') AS window_start,
      (date_trunc('day', v."createdAt") + interval '1 day') AS window_end
    FROM
      "Votes" v
    WHERE
      cancelled <> TRUE AND
      "createdAt" > '${crossoverTime.toISOString()}'
    GROUP BY
      "documentId",
      "collectionName",
      date_trunc('day', v."createdAt")
  `;
  const uniqueIndexGenerator = (viewName: string) => `
    CREATE UNIQUE INDEX "${viewName}_unique_index" ON "${viewName}" ("documentId", "collectionName", window_end);
  `;

  const hybridView = new HybridView({queryGenerator: viewQuery, identifier: "test_hybrid_view", indexQueryGenerators: [uniqueIndexGenerator]});

  await hybridView.ensureView();
  await hybridView.refreshMaterializedView();

  const db = getSqlClientOrThrow();

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
  const res = await db.any(fullQuery, []);
  console.log({res});
};

Globals.testHybridViews = testHybridViews;
