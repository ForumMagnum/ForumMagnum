import { recordPerfMetrics } from "./perfMetricWrapper";
import moment from "moment";
import { getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { randomId } from "../../lib/random";
import chunk from "lodash/chunk";
import PostViewTimes from "../../lib/collections/postViewTimes/collection";
import IncrementalViewRepo from "./IncrementalViewRepo";

class PostViewTimesRepo extends IncrementalViewRepo<"PostViewTimes"> {
  constructor() {
    super(PostViewTimes);
  }

  async calculateDataForDateRange({
    startDate,
    endDate,
  }: {
    startDate: Date;
    endDate: Date;
  }): Promise<Omit<DbPostViewTime, "_id" | "schemaVersion" | "createdAt" | "legacyData">[]> {
    // Round startDate (endDate) down (up) to the nearest UTC date boundary
    const windowStart = moment.utc(startDate).startOf("day").toDate();
    const windowEnd = moment.utc(endDate).endOf("day").toDate();

    const analyticsDb = getAnalyticsConnectionOrThrow();

    const results = await analyticsDb.any<
      Omit<DbPostViewTime, "_id" | "schemaVersion" | "createdAt" | "legacyData"> & {
        viewCount: string;
        uniqueViewCount: string;
      }
    >(
      `
      SELECT
        client_id AS "clientId",
        post_id AS "postId",
        (date_trunc('day', timestamp)) AS "windowStart",
        (date_trunc('day', timestamp) + interval '1 day') AS "windowEnd",
        sum(INCREMENT) AS "totalSeconds"
      FROM
        event_timer_event
      WHERE
        client_id IS NOT NULL
        AND post_id IS NOT NULL
        AND timestamp >= $1
        AND timestamp <= $2
      GROUP BY
        client_id,
        post_id,
        date_trunc('day', timestamp)
    `,
      [windowStart, windowEnd]
    );

    // Manually convert the number fields from string to number (as this isn't handled automatically)
    const typedResults = results.map((views) => ({
      ...views,
      viewCount: parseInt(views.viewCount),
      uniqueViewCount: parseInt(views.uniqueViewCount),
    }));

    return typedResults;
  }

  async upsertData({ data }: { data: Omit<DbPostViewTime, "_id" | "schemaVersion" | "createdAt" | "legacyData">[] }) {
    const dataWithIds = data.map((item) => ({
      ...item,
      _id: randomId(),
    }));

    // Avoid doing too many at once, expect about 5000 total per day
    const chunks = chunk(dataWithIds, 1000);

    for (const chunk of chunks) {
      const values = chunk
        .map(
          (row) =>
            `('${row._id}', '${row.clientId}', '${row.postId}', '${row.windowStart.toISOString()}', '${row.windowEnd.toISOString()}', ${
              row.totalSeconds
            }, NOW(), NOW())`
        )
        .join(",");

      const onConflictUpdate = `
        "clientId" = EXCLUDED."clientId",
        "postId" = EXCLUDED."postId",
        "windowStart" = EXCLUDED."windowStart",
        "windowEnd" = EXCLUDED."windowEnd",
        "totalSeconds" = EXCLUDED."totalSeconds",
        "updatedAt" = NOW()
      `;

      // If the row with this ("clientId", "postId", "windowStart", "windowEnd") already exists, just update the numbers
      await this.none(`
        INSERT INTO "PostViewTimes" (
          "_id",
          "clientId",
          "postId",
          "windowStart",
          "windowEnd",
          "totalSeconds",
          "createdAt",
          "updatedAt"
        ) VALUES ${values}
        ON CONFLICT ("clientId", "postId", "windowStart", "windowEnd")
        DO UPDATE SET ${onConflictUpdate}
      `);
    }
  }

  async getDateBounds(): Promise<{ earliestWindowStart: Date | null; latestWindowEnd: Date | null }> {
    return (
      (await this.getRawDb().oneOrNone<{ earliestWindowStart: Date | null; latestWindowEnd: Date | null }>(`
      SELECT
        min("windowStart") AS "earliestWindowStart",
        max("windowEnd") AS "latestWindowEnd"
      FROM
        "PostViewTimes"
    `)) || {
        earliestWindowStart: null,
        latestWindowEnd: null,
      }
    );
  }

  async readsByPost({
    postIds,
  }: {
    postIds: string[];
  }): Promise<{ postId: string; totalReads: number; }[]> {
    const results = await this.getRawDb().any<{ postId: string; totalReads: string; }>(`
      SELECT
        "postId",
        sum(CASE WHEN "totalSeconds" >= 30 THEN 1 ELSE 0 END) AS "totalReads"
      FROM
        "PostViewTimes"
      WHERE
        "postId" IN ($1:csv)
      GROUP BY
        "postId"
      `,
      [postIds]
    )

    // Manually convert the number fields from string to number (as this isn't handled automatically)
    const typedResults = results.map((views) => ({
      ...views,
      totalReads: parseInt(views.totalReads),
    }));

    return typedResults
  }

  async readsByDate({
    postIds,
    startDate,
    endDate,
  }: {
    postIds: string[];
    startDate?: Date;
    endDate: Date;
  }): Promise<{ date: string; totalReads: number }[]> {
    const results = await this.getRawDb().any<{ date: string; readCount: string }>(`
      SELECT
        to_char(date_trunc('day', "windowStart"), 'YYYY-MM-DD') AS "date",
        sum(CASE WHEN "totalSeconds" >= 30 THEN 1 ELSE 0 END) AS "readCount"
      FROM
        "PostViewTimes"
      WHERE
        "postId" IN ($1:csv)
        ${startDate ? `AND "windowStart" >= '${startDate.toISOString()}'` : ""}
        AND "windowEnd" <= '${endDate.toISOString()}'
      GROUP BY
        "date"
      ORDER BY
        "date"
      `,
      [postIds]
    );

    // Manually convert the number fields from string to number (as this isn't handled automatically)
    const typedResults = results.map((views) => ({
      date: views.date,
      totalReads: parseInt(views.readCount),
    }));

    return typedResults;
  }
}

recordPerfMetrics(PostViewTimesRepo);

export default PostViewTimesRepo;
