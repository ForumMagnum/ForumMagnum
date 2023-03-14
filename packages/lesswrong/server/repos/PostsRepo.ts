import { postStatuses } from "../../lib/collections/posts/constants";
import Posts from "../../lib/collections/posts/collection";
import AbstractRepo from "./AbstractRepo";

export type MeanPostKarma = {
  _id: number,
  meanKarma: number,
}

export default class PostsRepo extends AbstractRepo<DbPost> {
  constructor() {
    super(Posts);
  }

  private getKarmaInflationSelector(): string {
    return `
      "status" = ${postStatuses.STATUS_APPROVED} AND
      "draft" = FALSE AND
      "isFuture" = FALSE AND
      "unlisted" = FALSE AND
      "shortform" = FALSE AND
      "authorIsUnreviewed" = FALSE AND
      "hiddenRelatedQuestion" = FALSE AND
      "isEvent" = FALSE AND
      "postedAt" IS NOT NULL
    `;
  }

  async getEarliestPostTime(): Promise<Date> {
    const result = await this.oneOrNone(`
      SELECT "postedAt" FROM "Posts"
      WHERE ${this.getKarmaInflationSelector()}
      ORDER BY "postedAt" ASC
      LIMIT 1
    `);
    return result?.postedAt ?? new Date();
  }

  getMeanKarmaByInterval(startDate: Date, averagingWindowMs: number): Promise<MeanPostKarma[]> {
    return this.getRawDb().any(`
      SELECT "_id", AVG("baseScore") AS "meanKarma"
      FROM (
        SELECT
          FLOOR(EXTRACT(EPOCH FROM "postedAt" - $1) / ($2 / 1000)) AS "_id",
          "baseScore"
        FROM "Posts"
        WHERE ${this.getKarmaInflationSelector()}
      ) Q
      GROUP BY "_id"
      ORDER BY "_id"
    `, [startDate, averagingWindowMs]);
  }

  async getMeanKarmaOverall(): Promise<number> {
    const result = await this.getRawDb().oneOrNone(`
      SELECT AVG("baseScore") AS "meanKarma"
      FROM "Posts"
      WHERE ${this.getKarmaInflationSelector()}
    `);
    return result?.meanKarma ?? 0;
  }

  async updateDebugScore(dateString) {
    const query = `
      UPDATE "Posts" p
      SET "debugScore" = sub.debugScore
      FROM (
          SELECT p."_id", SUM(v."power") AS debugScore
          FROM "Votes" v
          INNER JOIN "Posts" p ON v."documentId" = p."_id"
          WHERE v."cancelled" IS false AND v."collectionName" = 'Posts'
              AND v."createdAt" < $1
              AND p."postedAt" >= (DATE $1 - INTERVAL '28 days')
          GROUP BY p."_id"
      ) sub
      WHERE p."_id" = sub."_id";
    `;
    const params = [dateString];
    await this.getRawDb().none(query, params);
  }
}
