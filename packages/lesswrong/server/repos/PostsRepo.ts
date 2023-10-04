import Posts from "../../lib/collections/posts/collection";
import { ensureIndex } from '../../lib/collectionIndexUtils';
import AbstractRepo from "./AbstractRepo";
import { logIfSlow } from "../../lib/sql/sqlClient";
import { eaPublicEmojiNames } from "../../lib/voting/eaEmojiPalette";
import LRU from "lru-cache";
import { getViewablePostsSelector } from "./helpers";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/collection";

export type MeanPostKarma = {
  _id: number,
  meanKarma: number,
}

type PostAndDigestPost = DbPost & {digestPostId: string|null, emailDigestStatus: string|null, onsiteDigestStatus: string|null}

// Map from emoji names to an array of user display names
type PostEmojiReactors = Record<string, string[]>;

const postEmojiReactorCache = new LRU<string, Promise<PostEmojiReactors>>({
  maxAge: 30 * 1000, // 30 second TTL
  updateAgeOnGet: false,
});

// Map from comment ids to maps from emoji names to an array of user display names
type CommentEmojiReactors = Record<string, Record<string, string[]>>;

const commentEmojiReactorCache = new LRU<string, Promise<CommentEmojiReactors>>({
  maxAge: 30 * 1000, // 30 second TTL
  updateAgeOnGet: false,
});

export default class PostsRepo extends AbstractRepo<DbPost> {
  constructor() {
    super(Posts);
  }

  async getEarliestPostTime(): Promise<Date> {
    const result = await this.oneOrNone(`
      SELECT "postedAt" FROM "Posts"
      WHERE ${getViewablePostsSelector()}
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
        WHERE ${getViewablePostsSelector()}
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
      WHERE ${getViewablePostsSelector()}
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

  async getPostEmojiReactors(postId: string): Promise<PostEmojiReactors> {
    const {emojiReactors} = await this.getRawDb().one(`
      SELECT JSON_OBJECT_AGG("key", "displayNames") AS "emojiReactors"
      FROM (
        SELECT
          "key",
          (ARRAY_AGG(
            "displayName" ORDER BY COALESCE("karma", 0) DESC)
          ) AS "displayNames"
        FROM (
          SELECT
            u."displayName",
            u."karma",
            (JSONB_EACH(v."extendedVoteType")).*
          FROM "Votes" v
          JOIN "Users" u ON u."_id" = v."userId"
          WHERE
            v."collectionName" = 'Posts' AND
            v."documentId" = $1 AND
            v."cancelled" IS NOT TRUE AND
            v."isUnvote" IS NOT TRUE AND
            v."extendedVoteType" IS NOT NULL
        ) q
        WHERE "key" IN ($2:csv) AND "value" = TO_JSONB(TRUE)
        GROUP BY "key"
      ) q
    `, [postId, eaPublicEmojiNames]);
    return emojiReactors;
  }

  async getPostEmojiReactorsWithCache(postId: string): Promise<PostEmojiReactors> {
    const cached = postEmojiReactorCache.get(postId);
    if (cached !== undefined) {
      return cached;
    }
    const emojiReactors = this.getPostEmojiReactors(postId);
    postEmojiReactorCache.set(postId, emojiReactors);
    return emojiReactors;
  }

  async getCommentEmojiReactors(postId: string): Promise<CommentEmojiReactors> {
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

  async getCommentEmojiReactorsWithCache(postId: string): Promise<CommentEmojiReactors> {
    const cached = commentEmojiReactorCache.get(postId);
    if (cached !== undefined) {
      return cached;
    }
    const emojiReactors = this.getCommentEmojiReactors(postId);
    commentEmojiReactorCache.set(postId, emojiReactors);
    return emojiReactors;
  }

  getTopWeeklyDigestPosts(limit = 3): Promise<DbPost[]> {
    return this.any(`
      SELECT p.*
      FROM "Posts" p
      JOIN "DigestPosts" dp ON p."_id" = dp."postId"
      JOIN "Digests" d ON d."_id" = dp."digestId"
      ORDER BY d."num" DESC, p."baseScore" DESC
      LIMIT $1
    `, [limit]);
  }

  getRecentlyActiveDialogues(limit = 3): Promise<DbPost[]> {
    return this.any(`
      SELECT p.*, c."mostRecentCommentAt"
      FROM "Posts" p
      JOIN (
          SELECT "postId", MAX("createdAt") as "mostRecentCommentAt"
          FROM "Comments"
          WHERE "debateResponse" IS TRUE
          GROUP BY "postId"
          ) c ON p."_id" = c."postId"
      WHERE p.debate IS TRUE AND p.draft IS NOT TRUE
      ORDER BY GREATEST(p."postedAt", c."mostRecentCommentAt") DESC
      LIMIT $1
    `, [limit]);
  }

  async getPostIdsWithoutEmbeddings(): Promise<string[]> {
    const results = await this.getRawDb().any(`
      SELECT p."_id"
      FROM "Posts" p
      LEFT JOIN "PostEmbeddings" pe ON p."_id" = pe."postId"
      WHERE
        pe."embeddings" IS NULL AND
        COALESCE((p."contents"->'wordCount')::INTEGER, 0) > 0
    `);
    return results.map(({_id}) => _id);
  }

  getDigestHighlights({
    maxAgeInDays = 31,
    numPostsPerDigest = 2,
    limit = 10,
  }): Promise<DbPost[]> {
    return this.any(`
      SELECT p.*
      FROM (
        SELECT
          p."_id",
          d."num" AS "digestNum",
          ROW_NUMBER() OVER(
            PARTITION BY dp."digestId" ORDER BY p."baseScore" DESC
          ) AS "rowNum"
        FROM "Posts" p
        JOIN "DigestPosts" dp ON p."_id" = dp."postId"
        JOIN "Digests" d ON
          dp."digestId" = d."_id" AND
          FLOOR(EXTRACT(EPOCH FROM NOW() - d."startDate") / 86400) <= $1
      ) q
      JOIN "Posts" p ON q."_id" = p."_id"
      WHERE q."rowNum" <= $2
      ORDER BY q."digestNum" DESC, q."rowNum" ASC
      LIMIT $3
    `, [maxAgeInDays, numPostsPerDigest, limit]);
  }

  getCuratedAndPopularPosts({currentUser, days = 7, limit = 3}: {
    currentUser?: DbUser | null,
    days?: number,
    limit?: number,
  } = {}) {
    const postFilter = getViewablePostsSelector("p");
    const readFilter = currentUser
      ? {
        join: `
          LEFT JOIN "ReadStatuses" rs ON
            p."_id" = rs."postId" AND
            rs."userId" = $3
        `,
        filter: `rs."isRead" IS NOT TRUE AND`,
      }
      : {join: "", filter: ""};
    return this.any(`
      SELECT p.*
      FROM "Posts" p
      ${readFilter.join}
      WHERE
        NOW() - p."curatedDate" < ($1 || ' days')::INTERVAL AND
        p."disableRecommendation" IS NOT TRUE AND
        ${readFilter.filter}
        ${postFilter}
      UNION
      SELECT p.*
      FROM "Posts" p
      JOIN "Users" u ON p."userId" = u."_id"
      ${readFilter.join}
      WHERE
        p."curatedDate" IS NULL AND
        NOW() - p."frontpageDate" < ($1 || ' days')::INTERVAL AND
        COALESCE(
          (p."tagRelevance"->'${EA_FORUM_COMMUNITY_TOPIC_ID}')::INTEGER,
          0
        ) < 1 AND
        p."groupId" IS NULL AND
        p."disableRecommendation" IS NOT TRUE AND
        u."deleted" IS NOT TRUE AND
        ${readFilter.filter}
        ${postFilter}
      ORDER BY "curatedDate" DESC NULLS LAST, "baseScore" DESC
      LIMIT $2
    `, [String(days), limit, currentUser?._id]);
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
}

ensureIndex(Posts, {debate:-1})
