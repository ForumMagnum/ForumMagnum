import Posts from "../../lib/collections/posts/collection";
import AbstractRepo from "./AbstractRepo";
import { eaPublicEmojiNames } from "../../lib/voting/eaEmojiPalette";
import LRU from "lru-cache";
import { getViewablePostsSelector } from "./helpers";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { isAF } from "../../lib/instanceSettings";

type DbPostWithContents = DbPost & {contents?: DbRevision | null};

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

type PostAndCommentsResultRow = {
  postId: string
  commentIds: string[]|null
  subscribedPosts: boolean|null
  subscribedComments: boolean|null
};

class PostsRepo extends AbstractRepo<"Posts"> {
  constructor() {
    super(Posts);
  }
  
  moveCoauthorshipToNewUser(oldUserId: string, newUserId: string): Promise<null> {
    return this.none(`
      -- PostsRepo.moveCoauthorshipToNewUser
      UPDATE "Posts"
      SET "coauthorStatuses" = array(
        SELECT
          CASE
            WHEN (jsonb_elem->>'userId') = $1
            THEN jsonb_set(jsonb_elem, '{userId}', to_jsonb($2::text), false)
            ELSE jsonb_elem
          END
          FROM unnest("coauthorStatuses") AS t(jsonb_elem)
      )
      WHERE EXISTS (
        SELECT 1 FROM unnest("coauthorStatuses") AS sub(jsonb_sub)
        WHERE jsonb_sub->>'userId' = $1
      );
    `, [oldUserId, newUserId]);
  }

  async postRouteWillDefinitelyReturn200(id: string): Promise<boolean> {
    const maybeRequireAF = isAF ? "AND af IS TRUE" : ""
    const res = await this.getRawDb().oneOrNone<{exists: boolean}>(`
      -- PostsRepo.postRouteWillDefinitelyReturn200
      SELECT EXISTS(
        SELECT 1
        FROM "Posts"
        WHERE "_id" = $1 AND ${getViewablePostsSelector()}
        ${maybeRequireAF}
      )
    `, [id]);

    return res?.exists ?? false;
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
        p."draft" is not true AND
        p."deletedDraft" is not true
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
        CASE
          WHEN author."deleted" THEN NULL
          ELSE author."slug"
        END AS "authorSlug",
        CASE
          WHEN author."deleted" THEN NULL
          ELSE author."displayName"
        END AS "authorDisplayName",
        CASE
          WHEN author."deleted" THEN NULL
          ELSE author."fullName"
        END AS "authorFullName",
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

  async getPostsWithElicitData(): Promise<DbPostWithContents[]> {
    return await this.getRawDb().any(`
      -- PostsRepo.getPostsWithElicitData
      SELECT p.*, ROW_TO_JSON(r.*) "contents"
      FROM "Posts" p
      INNER JOIN "Revisions" r ON p."contents_latest" = r."_id"
      WHERE r."html" LIKE '%elicit-binary-prediction%'
    `);
  }

  /**
   * Returns the number of posts that a user has authored in a given year, and their percentile among all users who
   * authored at least one post in that year. This is currently used for Wrapped.
   */
  async getAuthorshipStats({
    userId,
    year,
  }: {
    userId: string;
    year: number;
  }): Promise<{ totalCount: number; percentile: number }> {
    const startPostedAt = new Date(year, 0).toISOString();
    const endPostedAt = new Date(year + 1, 0).toISOString();

    const result = await this.getRawDb().oneOrNone<{ total_count: string; percentile: number }>(
      `
      -- PostsRepo.getAuthorshipStats
      WITH visible_posts AS (
        SELECT
          "userId",
          "coauthorStatuses"
        FROM
          "Posts"
        WHERE
          ${getViewablePostsSelector()}
          AND "postedAt" > $1
          AND "postedAt" < $2
      ),
      authorships AS ((
          SELECT
            "userId"
          FROM
            visible_posts)
        UNION ALL (
          SELECT
            unnest("coauthorStatuses") ->> 'userId' AS "userId"
          FROM
            visible_posts)
      ),
      authorship_counts AS (
        SELECT
          "userId",
          count(*) AS total_count
        FROM
          authorships
        GROUP BY
          "userId"
      ),
      authorship_percentiles AS (
        SELECT
          "userId",
          total_count,
          percent_rank() OVER (ORDER BY total_count ASC) percentile
        FROM
          authorship_counts
      )
      SELECT
        total_count,
        percentile
      FROM
        authorship_percentiles
      WHERE
        "userId" = $3;
    `,
      [startPostedAt, endPostedAt, userId]
    );

    return {
      totalCount: result?.total_count ? parseInt(result.total_count) : 0,
      percentile: result?.percentile ?? 0,
    };
  }

  /**
   * Returns the number of posts that a user has read that were authored by a given user in a given year, and their
   * percentile among all users who read at least one post by that author in that year. This is currently used for Wrapped.
   */
  async getReadAuthorStats({
    userId,
    authorUserId,
    year,
  }: {
    userId: string;
    authorUserId: string;
    year: number;
  }): Promise<{ totalCount: number; percentile: number }> {
    const startPostedAt = new Date(year, 0, 1);
    const endPostedAt = new Date(year + 1, 0, 1);

    const result = await this.getRawDb().oneOrNone<{ total_count: string; percentile: number }>(
      `
      -- PostsRepo.getReadAuthorStats
      WITH authored_posts AS (
        SELECT DISTINCT
          _id AS "postId"
        FROM
          "Posts" p
          LEFT JOIN LATERAL UNNEST(p."coauthorStatuses") AS unnested ON true
        WHERE
          ${getViewablePostsSelector("p")}
          AND (p."userId" = $3 OR unnested ->> 'userId' = $3)
      ),
      read_counts AS (
        SELECT
          "userId",
          count(*) AS total_count
        FROM
          authored_posts
          INNER JOIN "ReadStatuses" rs ON authored_posts."postId" = rs."postId" AND rs."isRead" IS TRUE
        WHERE
          "lastUpdated" >= $1
          AND "lastUpdated" < $2
        GROUP BY
          "userId"
      ),
      reader_percentiles AS (
        SELECT
          "userId",
          total_count,
          percent_rank() OVER (ORDER BY total_count ASC) percentile
        FROM
          read_counts
      )
      SELECT
        total_count,
        percentile
      FROM
        reader_percentiles
      WHERE
        "userId" = $4;
    `,
      [startPostedAt, endPostedAt, authorUserId, userId]
    );

    return {
      totalCount: result?.total_count ? parseInt(result.total_count) : 0,
      percentile: result?.percentile ?? 0,
    };
  }
  
  /**
   * Checks the posts that the user had read in the past 6 months,
   * and returns the number of posts per core tag that they have read.
   */
  async getUserReadsPerCoreTag(userId: string): Promise<{tagId: string; userReadCount: number;}[]> {
    return await this.getRawDb().any(
      `
      -- PostsRepo.getUserReadsPerCoreTag
      WITH core_tags AS (
        SELECT _id
        FROM "Tags"
        WHERE core IS TRUE AND deleted is not true
      )
      
      SELECT
        tr."tagId",
        count(*) AS "userReadCount"
      FROM
        "ReadStatuses" rs
      INNER JOIN "TagRels" tr ON rs."postId" = tr."postId"
      WHERE
        rs."lastUpdated" >= NOW() - interval '6 months'
        AND rs."userId" = $1
        AND rs."isRead" IS TRUE
        AND (
          tr."tagId" = 'u3Xg8MjDe2e6BvKtv' -- special case to include "AI governance"
          OR tr."tagId" IN (SELECT _id FROM core_tags)
        )
        AND tr."deleted" IS FALSE
      GROUP BY tr."tagId"
      `,
      [userId]
    )
  }

  /**
   * Get stats on how much the given user reads each core topic, relative to the average user. This is currently used
   * for Wrapped.
   */
  async getReadCoreTagStats({
    userId,
    year,
  }: {
    userId: string;
    year: number;
  }): Promise<{ tagId: string; tagName: string; tagShortName: string; userReadCount: number; readLikelihoodRatio: number }[]> {
    const startPostedAt = new Date(year, 0, 1);
    const endPostedAt = new Date(year + 1, 0, 1);

    const results = await this.getRawDb().any<{ tagId: string; name: string; shortName: string; read_count: number; ratio: number }>(
      `
      -- PostsRepo.getReadCoreTagStats
      WITH core_tags AS (
          SELECT _id
          FROM "Tags"
          WHERE core IS TRUE AND deleted is not true
      ),
      read_posts AS (
          SELECT
              *
          FROM
              "ReadStatuses" rs
          WHERE
              rs."lastUpdated" >= $1
              AND rs."lastUpdated" < $2
              AND rs."isRead" IS TRUE
      ),
      total_reads_by_tag AS (
          SELECT
              tr."tagId",
              count(*) AS read_count
          FROM
              read_posts
              INNER JOIN "TagRels" tr ON read_posts."postId" = tr."postId"
          WHERE
              tr."tagId" IN (SELECT _id FROM core_tags)
              AND tr."deleted" IS FALSE
          GROUP BY
              tr."tagId"
      ),
      user_reads_by_tag AS (
          SELECT
              tr."tagId",
              count(*) AS read_count
          FROM
              read_posts
              INNER JOIN "TagRels" tr ON read_posts."postId" = tr."postId"
          WHERE
              read_posts."userId" = $3
              AND tr."tagId" IN (SELECT _id FROM core_tags)
              AND tr."deleted" IS FALSE
          GROUP BY
              tr."tagId"
      ),
      total_reads AS (
          SELECT
              sum(read_count) AS total_count
          FROM
              total_reads_by_tag
      ),
      user_reads AS (
          SELECT
              sum(read_count) AS total_count
          FROM
              user_reads_by_tag
      )
      SELECT
          tr."tagId",
          t.name,
          t."shortName",
          ur.read_count,
          (coalesce(ur.read_count::float, 0.0) / user_reads.total_count) / (tr.read_count::float / total_reads.total_count) AS ratio
      FROM
          total_reads_by_tag tr
          LEFT JOIN user_reads_by_tag ur ON tr."tagId" = ur."tagId"
          INNER JOIN "Tags" t ON tr."tagId" = t._id,
          total_reads,
          user_reads
      ORDER BY
          ratio DESC;
    `,
      [startPostedAt, endPostedAt, userId]
    );

    return results.map(({ tagId, name, shortName, read_count, ratio }) => ({
      tagId,
      tagName: name,
      tagShortName: shortName,
      userReadCount: read_count,
      readLikelihoodRatio: ratio
    }));
  }

  async getActivelyDiscussedPosts(limit: number) {
    return await this.any(`
      WITH post_ids AS (
        SELECT "postId" AS _id,
        COALESCE(SUM(c."baseScore") FILTER (WHERE c."baseScore" > 5), 0) AS total_karma_from_high_karma_comments
        FROM "Comments" c
              LEFT JOIN "Posts" p ON p._id = c."postId"
        WHERE c."postedAt" > CURRENT_TIMESTAMP - INTERVAL '14 days'
        AND p.shortform IS NOT TRUE
        GROUP BY c."postId"
        HAVING COUNT(*) FILTER (WHERE c."baseScore" > 10) > 0
        ORDER BY COALESCE(SUM(c."baseScore") FILTER (WHERE c."baseScore" > 5), 0)
      )
      SELECT
          p.*
      FROM "Posts" p
      JOIN post_ids pid USING (_id)
      ORDER BY pid.total_karma_from_high_karma_comments DESC
      LIMIT $1
    `,
    [limit]);
  }

  async getPostsFromPostSubscriptions(userId: string, limit: number) {
    // 2024-04-26: This is used on a prototype subscriptions tab that's currently disabled, which might be dropped entirely and replaced with a better subscriptions tab
    return await this.any(`
      WITH user_subscriptions AS (
        SELECT DISTINCT type, "documentId" AS "userId"
        FROM "Subscriptions" s
        WHERE state = 'subscribed'
          AND s.deleted IS NOT TRUE
          AND "collectionName" = 'Users'
          AND "type" = 'newPosts'
          AND "userId" = $1
        )
      SELECT *
      FROM "Posts" p
      JOIN user_subscriptions us USING ("userId")
      WHERE p."postedAt" > CURRENT_TIMESTAMP - INTERVAL '90 days'
        AND type = 'newPosts'
        AND shortform IS NOT TRUE 
        AND draft IS NOT TRUE
      ORDER BY p."postedAt" DESC
      LIMIT $2
    `, 
    [userId, limit]);
  }
  
  async getPostsAndCommentsFromSubscriptions(userId: string, numDays: number): Promise<Array<PostAndCommentsResultRow >> {
    return await this.getRawDb().manyOrNone<PostAndCommentsResultRow>(`
      WITH user_subscriptions AS (
      SELECT DISTINCT "displayName", type, "documentId" AS "userId"
      FROM "Subscriptions" s
               LEFT JOIN "Users" u ON u._id = s."documentId"
      WHERE state = 'subscribed'
        AND s.deleted IS NOT TRUE
        AND "collectionName" = 'Users'
        AND "type" = 'newActivityForFeed'
        AND "userId" = $1
      ),
      posts_by_subscribees AS (
           SELECT
              p._id AS "postId",
              "postedAt",
              TRUE as "subscribedPosts"
           FROM "Posts" p
                    JOIN user_subscriptions us USING ("userId")
           WHERE p."postedAt" > CURRENT_TIMESTAMP - INTERVAL $2
           ORDER BY p."postedAt" DESC
       ),
      posts_with_comments_from_subscribees AS (
          SELECT
             "postId",
             ARRAY_AGG(c._id ORDER BY c."postedAt" DESC) AS "commentIds",
             MAX(c."postedAt") AS last_updated,
            TRUE as "subscribedComments"
          FROM "Comments" c
               JOIN user_subscriptions us USING ("userId")
          WHERE c."postedAt" > CURRENT_TIMESTAMP - INTERVAL $2
          AND (c."baseScore" >= 5 OR (c.contents->>'wordCount')::numeric >= 200)
          AND c.deleted IS NOT TRUE
          AND c."authorIsUnreviewed" IS NOT TRUE
          AND c.retracted IS NOT TRUE
          GROUP BY "postId"
      ),
      combined AS (
          SELECT
              *
          FROM
              posts_by_subscribees
          FULL JOIN posts_with_comments_from_subscribees USING ("postId")
      )
      SELECT combined.*
      FROM combined
      JOIN "Posts" p ON combined."postId" = p._id
      WHERE
        p.draft IS NOT TRUE
        AND p.status = 2
        AND p.rejected IS NOT TRUE
        AND p."authorIsUnreviewed" IS NOT TRUE
        AND p."hiddenRelatedQuestion" IS NOT TRUE
        AND p.unlisted IS NOT TRUE
        AND p."isFuture" IS NOT TRUE
      ORDER BY GREATEST(last_updated, combined."postedAt") DESC;
    `, [
      userId,
      `${numDays} days`
    ]);
  }
}

recordPerfMetrics(PostsRepo);

export default PostsRepo;
