import Posts from "../../lib/collections/posts/collection";
import AbstractRepo from "./AbstractRepo";
import { logIfSlow } from "../../lib/sql/sqlClient";
import { postStatuses } from "../../lib/collections/posts/constants";
import { eaPublicEmojiNames } from "../../lib/voting/eaEmojiPalette";
import LRU from "lru-cache";
import SelectQuery from "../../lib/sql/SelectQuery";
import { Comments } from "../../lib/collections/comments";
import CommentsRepo from "./CommentsRepo";
import Table from "../../lib/sql/Table";

export type MeanPostKarma = {
  _id: number,
  meanKarma: number,
}

type PostAndDigestPost = DbPost & {digestPostId: string|null, emailDigestStatus: string|null, onsiteDigestStatus: string|null}

type EmojiReactors = Record<string, Record<string, string[]>>;

const emojiReactorCache = new LRU<string, Promise<EmojiReactors>>({
  maxAge: 30 * 1000, // 30 second TTL
  updateAgeOnGet: false,
});

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
    return await logIfSlow(async () => await this.getRawDb().manyOrNone(`
      SELECT p.*, rs."lastUpdated"
      FROM "Posts" p
      JOIN "ReadStatuses" rs ON rs."postId" = p."_id"
      WHERE rs."userId" = '${userId}'
      ORDER BY rs."lastUpdated" desc
      LIMIT $1
    `, [limit]), "getReadHistoryForUser");
  }
  
  async getEligiblePostsForDigest(digestId: string, startDate: Date, endDate?: Date): Promise<Array<PostAndDigestPost>> {
    const end = endDate ?? new Date()
    return await logIfSlow(async () => await this.getRawDb().manyOrNone(`
      SELECT p.*, dp._id as "digestPostId", dp."emailDigestStatus", dp."onsiteDigestStatus"
      FROM "Posts" p
      LEFT JOIN "DigestPosts" dp ON dp."postId" = p."_id" AND dp."digestId" = $1
      WHERE p."postedAt" > $2 AND
        p."postedAt" <= $3 AND
        p."baseScore" > 2 AND
        p."isEvent" is not true AND
        p."shortform" is not true AND
        p."isFuture" is not true AND
        p."authorIsUnreviewed" is not true AND
        p."draft" is not true
      ORDER BY p."baseScore" desc
      LIMIT 200
    `, [digestId, startDate, end]), "getEligiblePostsForDigest");
  }

  async getEmojiReactors(postId: string): Promise<EmojiReactors> {
    const {emojiReactors} = await this.getRawDb().one(`
      SELECT JSON_OBJECT_AGG("commentId", "reactorDisplayNames") AS "emojiReactors"
      FROM (
        SELECT
          "commentId",
          JSON_OBJECT_AGG("key", "displayNames")
            FILTER (WHERE "key" IN ($2:csv))
            AS "reactorDisplayNames"
        FROM (
          SELECT
            "commentId",
            "key",
            (ARRAY_AGG(
              "displayName" ORDER BY COALESCE("karma", 0) DESC)
            ) AS "displayNames"
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
    `, [postId, eaPublicEmojiNames]);
    return emojiReactors;
  }

  async getEmojiReactorsWithCache(postId: string): Promise<EmojiReactors> {
    const cached = emojiReactorCache.get(postId);
    if (cached !== undefined) {
      return cached;
    }
    const emojiReactors = this.getEmojiReactors(postId);
    emojiReactorCache.set(postId, emojiReactors);
    return emojiReactors;
  }

  private getSearchDocumentQuery(): string {
    return `
      SELECT
        p."_id",
        p."_id" AS "objectID",
        p."userId",
        p."url",
        p."title",
        p."slug",
        COALESCE(p."baseScore", 0) AS "baseScore",
        p."status",
        p."curatedDate" IS NOT NULL AND "curatedDate" < NOW() AS "curated",
        p."legacy",
        COALESCE(p."commentCount", 0) AS "commentCount",
        p."postedAt",
        p."createdAt",
        EXTRACT(EPOCH FROM p."postedAt") * 1000 AS "publicDateMs",
        COALESCE(p."isFuture", FALSE) AS "isFuture",
        COALESCE(p."isEvent", FALSE) AS "isEvent",
        COALESCE(p."rejected", FALSE) AS "rejected",
        COALESCE(p."authorIsUnreviewed", FALSE) AS "authorIsUnreviewed",
        COALESCE(p."viewCount", 0) AS "viewCount",
        p."lastCommentedAt",
        COALESCE(p."draft", FALSE) AS "draft",
        COALESCE(p."af", FALSE) AS "af",
        fm_post_tag_ids(p."_id") AS "tags",
        author."slug" AS "authorSlug",
        author."displayName" AS "authorDisplayName",
        author."fullName" AS "authorFullName",
        rss."nickname" AS "feedName",
        p."feedLink",
        p."contents"->>'html' AS "body",
        NOW() AS "exportedAt"
      FROM "Posts" p
      LEFT JOIN "Users" author ON p."userId" = author."_id"
      LEFT JOIN "RSSFeeds" rss ON p."feedId" = rss."_id"
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaPost> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE p."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<AlgoliaPost[]> {
    return this.getRawDb().any(`
      ${this.getSearchDocumentQuery()}
      ORDER BY p."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Posts"`);
    return count;
  }

  getRecentDiscussionThreads(selector: MongoSelector<DbComment>, commentOptions: MongoFindOptions<DbComment>) {
    const innerQuery = new SelectQuery(Table.fromCollection(Comments), selector, { ...commentOptions, projection: { postId: 1, _id: 0 } });
    const { sql, args } = innerQuery.compile();

    console.log({ sql, args });
    // const outQuery = new SelectQuery(this.getCollection().table, )
    // return this.getCollection().executeReadQuery()
    // const selectQueryAtoms = selectQuery.compileSelector(selector);
    // const { sql: filterWhereClause, args: filterArgs } = selectQuery.compileAtoms(selectQueryAtoms, 2);

    return logIfSlow(async () => await this.manyOrNone(`
      SELECT *
      FROM "Posts"
      WHERE _id IN (${sql})
    `, args), "getRecentDiscussionThreads");
  }
}
