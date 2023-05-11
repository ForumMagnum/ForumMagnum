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
  
  async getSearchDocuments(limit: number, offset: number): Promise<Array<AlgoliaPost>> {
    const results = await this.getRawDb().many(`
      SELECT
        p._id AS "objectID",
        p._id,
        p."userId",
        p.url,
        p.title,
        p.slug,
        p."baseScore",
        p.status,
        p."curatedDate" is not null AND "curatedDate" < NOW() as curated,
        p.legacy,
        p."commentCount",
        p."postedAt",
        EXTRACT(EPOCH FROM p."postedAt") * 1000 as "publicDateMs",
        p."isFuture", -- TODO; should be handled by other stuff
        p."isEvent",
        p."viewCount", -- TODO; shouldn't pass this to the user
        p."lastCommentedAt",
        p.draft, -- TODO; should be handled by other stuff
        af,
        ARRAY(SELECT jsonb_object_keys("tagRelevancy")) AS tags,
        author.slug AS "authorSlug",
        author."displayName" AS "authorDisplayName",
        author."fullName" AS "authorFullName",
        rss."feedName",
        rss."feedLink",
        p.contents->>html as body,

    `);
    return results;
}
