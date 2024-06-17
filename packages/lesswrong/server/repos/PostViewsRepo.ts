import { recordPerfMetrics } from "./perfMetricWrapper";
import PostViews from "../../lib/collections/postViews/collection";
import moment from "moment";
import { getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { randomId } from "../../lib/random";
import chunk from "lodash/chunk";
import IncrementalViewRepo, { IncrementalViewDataType } from "./IncrementalViewRepo";
import { isE2E } from "../../lib/executionEnvironment";

class PostViewsRepo extends IncrementalViewRepo<"PostViews"> {
  constructor() {
    super(PostViews);
  }

  async calculateDataForDateRange({
    startDate,
    endDate,
  }: {
    startDate: Date;
    endDate: Date;
  }): Promise<
    IncrementalViewDataType<"PostViews">[]
  > {
    // Analytics DB is not available in e2e tests
    if (isE2E) {
      return [];
    }

    // Round startDate (endDate) down (up) to the nearest UTC date boundary
    const startDateFormatted = moment.utc(startDate).startOf("day").format("YYYY-MM-DD HH:mm:ss");
    const endDateFormatted = moment.utc(endDate).endOf("day").format("YYYY-MM-DD HH:mm:ss");

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
      [startDateFormatted, endDateFormatted]
    );

    // Manually convert:
    // - The number fields from string to number (as this isn't handled automatically)
    // - The date fields to UTC strings (NOTE: this actually changes the time represented, because in the conversion
    //   from postgres to JS the timezone of the server is applied to the raw date, so 2023-04-01 00:00:00 becomes e.g.
    //   2023-04-01 00:00:00+0100 (BST), which is wrong)
    const typedResults = results.map((views) => ({
      ...views,
      windowStart: moment(views.windowStart)
        .add(moment(views.windowStart).utcOffset(), "minutes")
        .utc()
        .format("YYYY-MM-DD HH:mm:ss"),
      windowEnd: moment(views.windowEnd)
        .add(moment(views.windowEnd).utcOffset(), "minutes")
        .utc()
        .format("YYYY-MM-DD HH:mm:ss"),
      viewCount: parseInt(views.viewCount),
      uniqueViewCount: parseInt(views.uniqueViewCount),
    }));

    return typedResults;
  }

  /**
   * Delete rows where there is any overlap with the given (startDate, endDate) range
   */
  async deleteRange({
    startDate,
    endDate,
  }: {
    startDate: Date;
    endDate: Date;
  }): Promise<void> {
    // Round startDate (endDate) down (up) to the nearest UTC date boundary
    const startDateFormatted = moment.utc(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endDateFormatted = moment.utc(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    await this.getRawDb().none(
      `
      DELETE FROM "PostViews"
      WHERE
        ("windowEnd" > $1 AND "windowEnd" < $2)
        OR ("windowStart" > $1 AND "windowStart" < $2)
      `,
      [startDateFormatted, endDateFormatted]
    );
  }

  async upsertData({ data }: { data: IncrementalViewDataType<"PostViews">[] }) {
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
            `('${row._id}', '${row.postId}', '${row.windowStart}', '${row.windowEnd}', ${
              row.viewCount
            }, ${row.uniqueViewCount}, NOW(), NOW())`
        )
        .join(",");

      const onConflictUpdate = `
        "postId" = EXCLUDED."postId",
        "windowStart" = EXCLUDED."windowStart",
        "windowEnd" = EXCLUDED."windowEnd",
        "viewCount" = EXCLUDED."viewCount",
        "uniqueViewCount" = EXCLUDED."uniqueViewCount",
        "updatedAt" = NOW()
      `;

      // If the row with this ("postId", "windowStart", "windowEnd") already exists, just update the numbers
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

  async getDateBounds(): Promise<{ earliestWindowStart: Date | null; latestWindowEnd: Date | null }> {
    return (
      (await this.getRawDb().oneOrNone<{ earliestWindowStart: Date | null; latestWindowEnd: Date | null }>(`
      SELECT
        min("windowStart") AS "earliestWindowStart",
        max("windowEnd") AS "latestWindowEnd"
      FROM
        "PostViews"
    `)) || {
        earliestWindowStart: null,
        latestWindowEnd: null,
      }
    );
  }

  async viewsByPost({
    postIds,
  }: {
    postIds: string[];
  }): Promise<{ postId: string; totalViews: number; totalUniqueViews: number }[]> {
    const results = await this.getRawDb().any<{ postId: string; totalViews: string; totalUniqueViews: string }>(`
      SELECT
        "postId",
        sum("viewCount") AS "totalViews",
        sum("uniqueViewCount") AS "totalUniqueViews"
      FROM
        "PostViews"
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
      totalViews: parseInt(views.totalViews),
      totalUniqueViews: parseInt(views.totalUniqueViews),
    }));

    return typedResults
  }

  async viewsByDate({
    postIds,
    startDate,
    endDate,
  }: {
    postIds: string[];
    startDate?: Date;
    endDate: Date;
  }): Promise<{ date: string; totalViews: number }[]> {
    const results = await this.getRawDb().any<{ date: string; viewCount: string }>(`
      SELECT
        to_char(date_trunc('day', "windowStart"), 'YYYY-MM-DD') AS "date",
        sum("viewCount") AS "viewCount"
      FROM
        "PostViews"
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
      totalViews: parseInt(views.viewCount),
    }));

    return typedResults;
  }
}

recordPerfMetrics(PostViewsRepo);

export default PostViewsRepo;
