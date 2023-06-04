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

  async getReadHistoryForUser(userId: string, limit: number): Promise<Array<DbPost & {lastUpdated: Date}>> {
    return await logIfSlow(async () => await this.getRawDb().many(`
      SELECT p.*, rs."lastUpdated"
      FROM "Posts" p
      JOIN "ReadStatuses" rs ON rs."postId" = p."_id"
      WHERE rs."userId" = '${userId}'
      ORDER BY rs."lastUpdated" desc
      LIMIT $1
    `, [limit]), "getReadHistoryForUser");
  }

  async getEmojiReactors(
    postId: string,
    maxReactorsPerEmoji = 4,
  ): Promise<Record<string, Record<string, string[]>>> {
    const result = await this.getRawDb().one(`
      SELECT JSON_OBJECT_AGG("commentId", "reactorDisplayNames") AS "emojiReactors"
      FROM (
        SELECT
          "commentId",
          JSON_OBJECT_AGG("key", "displayNames") AS "reactorDisplayNames"
        FROM (
          SELECT
            "commentId",
            "key",
            (ARRAY_AGG("displayName" ORDER BY "karma" DESC))[1:$2] AS "displayNames"
          FROM (
            SELECT
              c."_id" AS "commentId",
              u."displayName",
              u."karma",
              (JSONB_EACH(v."extendedVoteType")).*
            FROM "Comments" c
            JOIN "Votes" v ON
              v."collectionName" = 'Comments' AND
              v."documentId" = c."_id" AND
              v."cancelled" IS NOT TRUE AND
              v."isUnvote" IS NOT TRUE AND
              v."extendedVoteType" IS NOT NULL
            JOIN "Users" u ON u."_id" = v."userId"
            WHERE c."postId" = $1
          ) q
          WHERE "value" = TO_JSONB(TRUE)
          GROUP BY "commentId", "key"
        ) q
        GROUP BY "commentId"
      ) q
    `, [postId, maxReactorsPerEmoji]);
    return result.emojiReactors;
  }
}
