import Posts from "../../lib/collections/posts/collection";
import AbstractRepo from "./AbstractRepo";
import { eaPublicEmojiNames } from "../../lib/voting/eaEmojiPalette";
import LRU from "lru-cache";
import { getViewablePostsSelector } from "./helpers";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";

type MeanPostKarma = {
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

class PostsRepo extends AbstractRepo<"Posts"> {
  constructor() {
    super(Posts);
  }

  async getEarliestPostTime(): Promise<Date> {
    const result = await this.oneOrNone(`
      -- PostsRepo.getEarliestPostTime
      SELECT "postedAt" FROM "Posts"
      WHERE ${getViewablePostsSelector()}
      ORDER BY "postedAt" ASC
      LIMIT 1
    `);
    return result?.postedAt ?? new Date();
  }

  async getMeanKarmaByInterval(startDate: Date, averagingWindowMs: number): Promise<MeanPostKarma[]> {
    return this.getRawDb().any(`
      -- PostsRepo.getMeanKarmaByInterval
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
    `, [startDate, averagingWindowMs], "getMeanKarmaByInterval");
  }

  async getMeanKarmaOverall(): Promise<number> {
    const result = await this.getRawDb().oneOrNone(`
      -- PostsRepo.getMeanKarmaOverall
      SELECT AVG("baseScore") AS "meanKarma"
      FROM "Posts"
      WHERE ${getViewablePostsSelector()}
    `, [], "getMeanKarmaOverall");
    return result?.meanKarma ?? 0;
  }

  async getReadHistoryForUser(userId: string, limit: number): Promise<Array<DbPost & {lastUpdated: Date}>> {
    return await this.getRawDb().manyOrNone(`
      -- PostsRepo.getReadHistoryForUser
      SELECT p.*, rs."lastUpdated"
      FROM "Posts" p
      JOIN "ReadStatuses" rs ON rs."postId" = p."_id"
      WHERE rs."userId" = '${userId}'
      ORDER BY rs."lastUpdated" desc
      LIMIT $1
    `, [limit], "getReadHistoryForUser");
  }

  async getEligiblePostsForDigest(digestId: string, startDate: Date, endDate?: Date): Promise<Array<PostAndDigestPost>> {
    const end = endDate ?? new Date()
    return this.getRawDb().manyOrNone(`
      -- PostsRepo.getEligiblePostsForDigest
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
    `, [digestId, startDate, end], "getEligiblePostsForDigest");
  }

  async getPostEmojiReactors(postId: string): Promise<PostEmojiReactors> {
    const {emojiReactors} = await this.getRawDb().one(`
      -- PostsRepo.getPostEmojiReactors
      SELECT JSON_OBJECT_AGG("key", "displayNames") AS "emojiReactors"
      FROM (
        SELECT
          "key",
          (ARRAY_AGG(
            "displayName" ORDER BY "createdAt" ASC)
          ) AS "displayNames"
        FROM (
          SELECT
            u."displayName",
            v."createdAt",
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
      -- PostsRepo.getCommentEmojiReactors
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
              "displayName" ORDER BY "createdAt" ASC)
            ) AS "displayNames"
          FROM (
            SELECT
              c."_id" AS "commentId",
              u."displayName",
              v."createdAt",
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
      -- PostsRepo.getTopWeeklyDigestPosts
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
      -- PostsRepo.getRecentlyActiveDialogues
      SELECT p.*
      FROM "Posts" p
      WHERE p."collabEditorDialogue" IS TRUE AND p.draft IS NOT TRUE
      ORDER BY GREATEST(p."postedAt", p."mostRecentPublishedDialogueResponseDate") DESC
      LIMIT $1
    `, [limit]);
  }

  getMyActiveDialogues(userId: string, limit = 3): Promise<DbPost[]> {
    return this.any(`
      -- PostsRepo.getMyActiveDialogues
      SELECT * 
      FROM (
          SELECT DISTINCT ON (p._id) p.* 
          FROM "Posts" p, UNNEST("coauthorStatuses") unnested
          WHERE p."collabEditorDialogue" IS TRUE 
          AND ((UNNESTED->>'userId' = $1) OR (p."userId" = $1))
      ) dialogues
      ORDER BY "modifiedAt" DESC
      LIMIT $2
    `, [userId, limit]);
  }

  async getPostIdsWithoutEmbeddings(): Promise<string[]> {
    const results = await this.getRawDb().any(`
      -- PostsRepo.getPostIdsWithoutEmbeddings
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
      -- PostsRepo.getDigestHighlights
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
      -- PostsRepo.getCuratedAndPopularPosts
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
      -- PostsRepo.getSearchDocumentQuery
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

  getSearchDocumentById(id: string): Promise<SearchPost> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE p."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<SearchPost[]> {
    return this.getRawDb().any(`
      -- PostsRepo.getSearchDocuments
      ${this.getSearchDocumentQuery()}
      ORDER BY p."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`
      -- PostsRepo.countSearchDocuments
      SELECT COUNT(*) FROM "Posts"
    `);
    return count;
  }

  async getUsersReadPostsOfTargetUser(userId: string, targetUserId: string, limit = 20): Promise<DbPost[]> {
    return this.any(`
      -- PostsRepo.getUsersReadPostsOfTargetUser
      SELECT p.*
      FROM "ReadStatuses" rs
      INNER JOIN "Posts" p 
      ON rs."postId" = p._id
      WHERE
          rs."userId" = $1
          AND p."userId" = $2
          AND rs."isRead" IS TRUE
      ORDER BY rs."lastUpdated" DESC
      LIMIT $3
    `, [userId, targetUserId, limit]);
  }

  async getPostsWithElicitData(): Promise<DbPost[]> {
    return await this.any(`
      -- PostsRepo.getPostsWithElicitData
      SELECT *
      FROM "Posts"
      WHERE contents->>'html' LIKE '%elicit-binary-prediction%'
    `);
  }

  // Used in the cronjob for archiving stale dialogues and notifying users about them 
  async getStaleDialogues(cutOffTime:Date): Promise<DbPost[]> {
    return this.getRawDb().any(`
      -- PostsRepo.getStaleDialogues
      SELECT p.*
      FROM "Posts" p
      JOIN "Revisions" r ON p."_id" = r."documentId"
      WHERE
        p."draft" IS TRUE AND
        p."collabEditorDialogue" IS TRUE AND
        p."deletedDraft" IS NOT TRUE AND
        r."editedAt" < $1
      GROUP BY p."_id"
    `, [cutOffTime]);
  }
}

recordPerfMetrics(PostsRepo);

export default PostsRepo;
