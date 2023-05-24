import { postStatuses } from "../../lib/collections/posts/constants";
import Posts from "../../lib/collections/posts/collection";
import AbstractRepo from "./AbstractRepo";
import { logIfSlow } from "../../lib/sql/sqlClient";

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

  async getMeanKarmaByInterval(startDate: Date, averagingWindowMs: number): Promise<MeanPostKarma[]> {
    return await logIfSlow(async () => this.getRawDb().any(`
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
    `, [startDate, averagingWindowMs]),
      "getMeanKarmaByInterval"
    );
  }

  async getMeanKarmaOverall(): Promise<number> {
    const result = await logIfSlow(async () => await this.getRawDb().oneOrNone(`
      SELECT AVG("baseScore") AS "meanKarma"
      FROM "Posts"
      WHERE ${this.getKarmaInflationSelector()}
    `), "getMeanKarmaOverall");
    return result?.meanKarma ?? 0;
  }
  
  async getReadHistoryForUser(userId: string): Promise<Array<DbPost & {lastUpdated: Date}>> {
    return await logIfSlow(async () => await this.getRawDb().many(`
      SELECT p.*, rs."lastUpdated"
      FROM "Posts" p
      JOIN "ReadStatuses" rs ON rs."postId" = p."_id"
      WHERE rs."userId" = '${userId}'
      ORDER BY rs."lastUpdated" desc
      LIMIT 10
    `), "getReadHistoryForUser");
  }
}
