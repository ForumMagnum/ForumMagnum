import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import PostViews from "../../lib/collections/postViews/collection";
import moment from "moment";
import { getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { randomId } from "../../lib/random";
import chunk from "lodash/chunk";

class PostViewsRepo extends AbstractRepo<"PostViews"> {
  constructor() {
    super(PostViews);
  }

  async calculateDataForDateRange({
    startDate,
    endDate,
  }: {
    startDate: Date;
    endDate: Date;
  }): Promise<Omit<DbPostViews, "_id" | "schemaVersion" | "createdAt" | "legacyData">[]> {
    // Round startDate (endDate) down (up) to the nearest UTC date boundary
    const windowStart = moment.utc(startDate).startOf('day').toDate();
    const windowEnd = moment.utc(endDate).endOf('day').toDate();

    const analyticsDb = getAnalyticsConnectionOrThrow();

    const results = await analyticsDb.any<
      Omit<DbPostViews, "_id" | "schemaVersion" | "createdAt" | "legacyData"> & {
        viewCount: string;
        uniqueViewCount: string;
      }
    >(
      `
      SELECT
        count(*) AS "viewCount",
        count(DISTINCT client_id) AS "uniqueViewCount",
        post_id as "postId",
        (date_trunc('day', timestamp)) AS "windowStart",
        (date_trunc('day', timestamp) + interval '1 day') AS "windowEnd"
      FROM
        page_view
      WHERE
        timestamp >= $1
        AND timestamp <= $2
        AND post_id IS NOT NULL
      GROUP BY
        post_id,
        date_trunc('day', timestamp)
    `,
      [windowStart, windowEnd]
    );

    // Manually convert the number fields from string to number (as this isn't handled automatically)
    const typedResults = results.map(views => ({
      ...views,
      viewCount: parseInt(views.viewCount),
      uniqueViewCount: parseInt(views.uniqueViewCount),
    }))

    return typedResults;
  }

  async upsertData({ data }: { data: Omit<DbPostViews, "_id" | "schemaVersion" | "createdAt" | "legacyData">[] }) {
    const dataWithIds = data.map(item => ({
      ...item,
      _id: randomId(),
    }));

    // Avoid doing too many at once, expect about 5000 total per day
    const chunks = chunk(dataWithIds, 1000);

    for (const chunk of chunks) {
      const values = chunk
        .map(
          (row) =>
            `('${row._id}', '${row.postId}', '${row.windowStart.toISOString()}', '${row.windowEnd.toISOString()}', ${
              row.viewCount
            }, ${row.uniqueViewCount}, NOW(), NOW())`
        )
        .join(",");

      // Construct the on conflict update string
      const onConflictUpdate = `
        "postId" = EXCLUDED."postId",
        "windowStart" = EXCLUDED."windowStart",
        "windowEnd" = EXCLUDED."windowEnd",
        "viewCount" = EXCLUDED."viewCount",
        "uniqueViewCount" = EXCLUDED."uniqueViewCount",
        "updatedAt" = NOW()
      `;

      // Execute the bulk INSERT query with an ON CONFLICT clause
      await this.none(`
        INSERT INTO "PostViews" (
          "_id",
          "postId",
          "windowStart",
          "windowEnd",
          "viewCount",
          "uniqueViewCount",
          "createdAt",
          "updatedAt"
        ) VALUES ${values}
        ON CONFLICT ("postId", "windowStart", "windowEnd")
        DO UPDATE SET ${onConflictUpdate}
      `);
    }
  }

  async getDataRange(): Promise<{earliestWindowStart: Date | null, latestWindowEnd: Date | null}> {
    // TODO re-check this when there is actual data
    return await this.getRawDb().oneOrNone<{earliestWindowStart: Date | null, latestWindowEnd: Date | null}>(`
      SELECT
        min("windowStart") AS "earliestWindowStart",
        max("windowEnd") AS "latestWindowEnd"
      FROM
        "PostViews"
    `) || {
      earliestWindowStart: null,
      latestWindowEnd: null,
    }
  }
}

recordPerfMetrics(PostViewsRepo);

export default PostViewsRepo;
