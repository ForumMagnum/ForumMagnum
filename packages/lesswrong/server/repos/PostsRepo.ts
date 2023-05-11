import Posts from "../../lib/collections/posts/collection";
import AbstractRepo from "./AbstractRepo";
import { postStatuses } from "../../lib/collections/posts/constants";

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
  
  async getReadHistoryForUser(userId: string): Promise<Array<DbPost & {lastUpdated: Date}>> {
    const results = await this.getRawDb().many(`
      SELECT p.*, rs."lastUpdated"
      FROM "Posts" p
      JOIN "ReadStatuses" rs ON rs."postId" = p."_id"
      WHERE rs."userId" = '${userId}'
      ORDER BY rs."lastUpdated" desc
      LIMIT 10
    `)
    return results
  }

  async getSearchDocuments(
    limit: number,
    offset: number,
  ): Promise<Array<AlgoliaPost>> {
    return this.getRawDb().any(`
      SELECT
        p."_id",
        p."_id" AS "objectID",
        p."userId",
        p."url",
        p."title",
        p."slug",
        p."baseScore",
        p."status",
        p."curatedDate" IS NOT NULL AND "curatedDate" < NOW() AS "curated",
        p."legacy",
        p."commentCount",
        p."postedAt",
        EXTRACT(EPOCH FROM p."postedAt") * 1000 AS "publicDateMs",
        p."isFuture",
        p."isEvent",
        p."viewCount",
        p."lastCommentedAt",
        p."draft",
        p."af",
        fm_post_tag_ids(p."_id") AS "tags",
        author."slug" AS "authorSlug",
        author."displayName" AS "authorDisplayName",
        author."fullName" AS "authorFullName",
        rss."nickname" AS "feedName",
        p."feedLink",
        fm_strip_html(p."contents"->>'html') AS "body"
      FROM "Posts" p
      LEFT JOIN "Users" author ON p."userId" = author."_id"
      LEFT JOIN "RSSFeeds" rss ON p."feedId" = rss."_id"
      WHERE
        p."status" = $1 AND
        p."authorIsUnreviewed" IS NOT TRUE AND
        p."rejected" IS NOT TRUE
      ORDER BY p."createdAt" DESC
      LIMIT $2
      OFFSET $3
    `, [postStatuses.STATUS_APPROVED, limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const result = await this.getRawDb().one(`
      SELECT COUNT(*)
      FROM "Posts" p
      WHERE
        p."status" = $1 AND
        p."authorIsUnreviewed" IS NOT TRUE AND
        p."rejected" IS NOT TRUE
    `, [postStatuses.STATUS_APPROVED]);
    return result.count;
  }
}
