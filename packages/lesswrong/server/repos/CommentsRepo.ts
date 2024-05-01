import Comments from "../../lib/collections/comments/collection";
import AbstractRepo from "./AbstractRepo";
import SelectQuery from "../../lib/sql/SelectQuery";
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import { filterWhereFieldsNotNull } from "../../lib/utils/typeGuardUtils";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { forumSelect } from "../../lib/forumTypeUtils";
import { isAF } from "../../lib/instanceSettings";
import { getViewablePostsSelector } from "./helpers";

type ExtendedCommentWithReactions = DbComment & {
  yourVote?: string,
  theirVote?: string,
  userVote?: string,
}

class CommentsRepo extends AbstractRepo<"Comments"> {
  constructor() {
    super(Comments);
  }

  async getPromotedCommentsOnPosts(postIds: string[]): Promise<(DbComment|null)[]> {
    const rawComments = await this.manyOrNone(`
      -- CommentsRepo.getPromotedCommentsOnPosts
      SELECT c.*
      FROM "Comments" c
      JOIN (
          SELECT "postId", MAX("promotedAt") AS max_promotedAt
          FROM "Comments"
          WHERE "postId" IN ($1:csv)
          AND "promotedAt" IS NOT NULL
          GROUP BY "postId"
      ) sq
      ON c."postId" = sq."postId" AND c."promotedAt" = sq.max_promotedAt;
    `, [postIds]);
    
    const comments = filterWhereFieldsNotNull(rawComments, "postId");
    const commentsByPost = keyBy(comments, c=>c.postId);
    return postIds.map(postId => commentsByPost[postId] ?? null);
  }

  async getRecentCommentsOnPosts(postIds: string[], limit: number, filter: MongoSelector<DbComment>): Promise<DbComment[][]> {
    const selectQuery = new SelectQuery(this.getCollection().getTable(), filter)
    const selectQueryAtoms = selectQuery.compileSelector(filter);
    const {sql: filterWhereClause, args: filterArgs} = selectQuery.compileAtoms(selectQueryAtoms, 2);

    const comments = await this.manyOrNone(`
      -- CommentsRepo.getRecentCommentsOnPosts
      WITH cte AS (
        SELECT
          comment_with_rownumber.*,
          ROW_NUMBER() OVER (PARTITION BY comment_with_rownumber."postId" ORDER BY comment_with_rownumber."postedAt" DESC) as rn
        FROM "Comments" comment_with_rownumber
        WHERE comment_with_rownumber."postId" IN ($1:csv)
        AND (
          ${filterWhereClause}
        )
      )
      SELECT *
      FROM cte
      WHERE rn <= $2
    `, [postIds, limit, ...filterArgs]);
    
    const commentsByPost = groupBy(comments, c=>c.postId);
    return postIds.map(postId =>
      orderBy(
        commentsByPost[postId] ?? [],
        c => -c.postedAt.getTime()
      )
    );
  }
  
  async getCommentsWithReacts(limit: number): Promise<(DbComment|null)[]> {
    return await this.manyOrNone(`
      -- CommentsRepo.getCommentsWithReacts
      SELECT c.*
      FROM "Comments" c
      JOIN (
          SELECT "documentId", MIN("votedAt") AS most_recent_react
          FROM "Votes"
          WHERE "collectionName" = 'Comments' AND "extendedVoteType"->'reacts' != '[]'::jsonb
          GROUP BY "documentId"
          ORDER BY most_recent_react DESC
          LIMIT $1
      ) v
      ON c._id = v."documentId"
      ORDER BY v.most_recent_react DESC;
    `, [limit]);
  }

  async getPopularPollComments (limit: number, pollCommentId: string): Promise<(ExtendedCommentWithReactions)[]> {
    return await this.getRawDb().manyOrNone(`
      -- CommentsRepo.getPopularPollComments
      SELECT c.*
      FROM public."Comments" AS c
      WHERE c."parentCommentId" = $2
      ORDER BY c."baseScore" DESC
      LIMIT $1
    `, [limit, pollCommentId]);
  }

  async getPopularPollCommentsWithUserVotes (userId: string, limit: number, pollCommentId: string): Promise<(ExtendedCommentWithReactions)[]> {
    return await this.getRawDb().manyOrNone(`
    -- CommentsRepo.getPopularPollCommentsWithUserVotes
    SELECT c.*, v."extendedVoteType"->'reacts'->0->>'react' AS "yourVote"
    FROM public."Comments" AS c
    INNER JOIN public."Votes" AS v ON c._id = v."documentId"
    WHERE
      c."parentCommentId" = $3
      AND v."userId" = $1
      AND v."extendedVoteType"->'reacts'->0->>'vote' = 'created'
      AND v.cancelled IS NOT TRUE
      AND v."isUnvote" IS NOT TRUE
    ORDER BY c."baseScore" DESC
    LIMIT $2
    `, [userId, limit, pollCommentId]);
  }

  async getPopularPollCommentsWithTwoUserVotes (userId: string, targetUserId: string, limit: number, pollCommentId: string): Promise<(ExtendedCommentWithReactions)[]> {
    return await this.getRawDb().manyOrNone(`
    -- CommentsRepo.getPopularPollCommentsWithTwoUserVotes
    SELECT c.*, 
        v1."extendedVoteType"->'reacts'->0->>'react' AS "yourVote", 
        v2."extendedVoteType"->'reacts'->0->>'react' AS "theirVote"
    FROM public."Comments" AS c
    LEFT JOIN public."Votes" AS v1 ON c._id = v1."documentId"
    LEFT JOIN public."Votes" AS v2 ON c._id = v2."documentId"
    WHERE
      c."parentCommentId" = $4
      AND v1."userId" = $1
      AND v1."extendedVoteType"->'reacts'->0->>'vote' = 'created'
      AND v1.cancelled IS NOT TRUE
      AND v1."isUnvote" IS NOT TRUE
      AND v2."userId" = $2
      AND v2."extendedVoteType"->'reacts'->0->>'vote' = 'created'
      AND v2.cancelled IS NOT TRUE
      AND v2."isUnvote" IS NOT TRUE
      AND v1."extendedVoteType"->'reacts'->0->>'react' != v2."extendedVoteType"->'reacts'->0->>'react'
    ORDER BY c."baseScore" DESC
    LIMIT $3
    `, [userId, targetUserId, limit, pollCommentId]);
  }

  async getPopularComments({
    minScore = 15,
    offset = 0,
    limit = 3,
    recencyFactor = 250000,
    recencyBias = 60 * 60 * 2,
  }: {
    offset?: number,
    limit?: number,
    minScore?: number,
    // The factor to divide age by for the recency bonus
    recencyFactor?: number,
    // The minimum age that a post will be considered as having, to avoid
    // over selecting brand new comments - defaults to 2 hours
    recencyBias?: number,
  }): Promise<DbComment[]> {
    const excludedTagId = forumSelect({
      EAForum: EA_FORUM_COMMUNITY_TOPIC_ID,
      default: null
    });

    const excludeTagId = !!excludedTagId;
    const excludedTagIdParam = excludeTagId ? { excludedTagId } : {};
    const excludedTagIdCondition = excludeTagId ? 'AND COALESCE((p."tagRelevance"->$(excludedTagId))::INTEGER, 0) < 1' : '';

    const lookbackPeriod = isAF ? '1 month' : '1 week';
    const afCommentsFilter = isAF ? 'AND "af" IS TRUE' : '';
    
    return this.any(`
      -- CommentsRepo.getPopularComments
      SELECT c.*
      FROM (
        SELECT DISTINCT ON ("postId") "_id"
        FROM "Comments"
        WHERE
          CURRENT_TIMESTAMP - "postedAt" < $(lookbackPeriod)::INTERVAL AND
          "shortform" IS NOT TRUE AND
          "baseScore" >= $(minScore) AND
          "retracted" IS NOT TRUE AND
          "deleted" IS NOT TRUE AND
          "deletedPublic" IS NOT TRUE AND
          "needsReview" IS NOT TRUE
          ${afCommentsFilter}
        ORDER BY "postId", "baseScore" DESC
      ) q
      JOIN "Comments" c ON c."_id" = q."_id"
      JOIN "Posts" p ON c."postId" = p."_id"
      WHERE
        p."hideFromPopularComments" IS NOT TRUE
        AND ${getViewablePostsSelector('p')}
        ${excludedTagIdCondition}
      ORDER BY c."baseScore" * EXP((EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - c."postedAt") + $(recencyBias)) / -$(recencyFactor)) DESC
      OFFSET $(offset)
      LIMIT $(limit)
    `, {
      minScore,
      offset,
      limit,
      recencyFactor,
      recencyBias,
      lookbackPeriod,
      ...excludedTagIdParam,
    });
  }

  private getSearchDocumentQuery(): string {
    return `
      -- CommentsRepo.getSearchDocumentQuery
      SELECT
        c."_id",
        c."_id" AS "objectID",
        c."userId",
        COALESCE(c."baseScore", 0) AS "baseScore",
        COALESCE(c."deleted", FALSE) AS "deleted",
        COALESCE(c."rejected", FALSE) AS "rejected",
        COALESCE(c."authorIsUnreviewed", FALSE) AS "authorIsUnreviewed",
        COALESCE(c."retracted", FALSE) AS "retracted",
        COALESCE(c."spam", FALSE) AS "spam",
        c."legacy",
        c."createdAt",
        c."postedAt",
        EXTRACT(EPOCH FROM c."postedAt") * 1000 AS "publicDateMs",
        COALESCE(c."af", FALSE) AS "af",
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
          ELSE author."username"
        END AS "authorUserName",
        c."postId",
        post."title" AS "postTitle",
        post."slug" AS "postSlug",
        COALESCE(post."isEvent", FALSE) AS "postIsEvent",
        post."groupId" AS "postGroupId",
        fm_post_tag_ids(post."_id") AS "tags",
        CASE WHEN c."tagId" IS NULL
          THEN fm_post_tag_ids(post."_id")
          ELSE ARRAY(SELECT c."tagId")
        END AS "tags",
        c."tagId",
        tag."name" AS "tagName",
        tag."slug" AS "tagSlug",
        c."tagCommentType",
        c."contents"->>'html' AS "body",
        NOW() AS "exportedAt"
      FROM "Comments" c
      LEFT JOIN "Users" author ON c."userId" = author."_id"
      LEFT JOIN "Posts" post on c."postId" = post."_id"
      LEFT JOIN "Tags" tag on c."tagId" = tag."_id"
    `;
  }

  getSearchDocumentById(id: string): Promise<SearchComment> {
    return this.getRawDb().one(`
      -- CommentsRepo.getSearchDocumentById
      ${this.getSearchDocumentQuery()}
      WHERE c."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<SearchComment[]> {
    return this.getRawDb().any(`
      -- CommentsRepo.getSearchDocuments
      ${this.getSearchDocumentQuery()}
      ORDER BY c."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`
      -- CommentsRepo.countSearchDocuents
      SELECT COUNT(*) FROM "Comments"
    `);
    return count;
  }

  async getCommentsPerDay({ postIds, startDate, endDate }: { postIds: string[]; startDate?: Date; endDate: Date; }): Promise<{ window_start_key: string; comment_count: string }[]> {
    return await this.getRawDb().any<{window_start_key: string, comment_count: string}>(`
      -- CommentsRepo.getCommentsPerDay
      SELECT
        -- Format as YYYY-MM-DD to make grouping easier
        to_char(c."postedAt", 'YYYY-MM-DD') AS window_start_key,
        COUNT(c."postedAt") AS comment_count
      FROM "Comments" c
      WHERE
        c."postId" IN ($1:csv)
        AND ($2 IS NULL OR c."postedAt" >= $2)
        AND c."postedAt" <= $3
        AND c."deleted" IS NOT TRUE
      GROUP BY
        window_start_key
      ORDER BY
        window_start_key;
    `, [postIds, startDate, endDate]);
  }

  async getUsersRecommendedCommentsOfTargetUser(userId: string, targetUserId: string, limit = 20): Promise<DbComment[]> {
    return this.any(`
      -- CommentsRepo.getUsersRecommendedCommentsOfTargetUser
      SELECT c.*
      FROM "ReadStatuses" AS rs
      INNER JOIN "Posts" AS p ON rs."postId" = p._id
      INNER JOIN "Comments" AS c ON c."postId" = p._id
      WHERE
          rs."userId" = $1
          AND c."userId" = $2
          AND rs."isRead" IS TRUE
          AND c."baseScore" > 7
      ORDER BY rs."lastUpdated" DESC
      LIMIT $3
    `, [userId, targetUserId, limit]);
  }

  async getCommentsWithElicitData(): Promise<DbComment[]> {
    return await this.any(`
      -- CommentsRepo.getCommentsWithElicitData
      SELECT *
      FROM "Comments"
      WHERE contents->>'html' LIKE '%elicit-binary-prediction%'
    `);
  }

  /**
   * Returns the number of comments that a user has authored in a given year, and their percentile among all users who
   * authored at least one comment in that year (for either regular comments or shortform). This is currently used for Wrapped.
   */
  async getAuthorshipStats({
    userId,
    year,
    shortform,
  }: {
    userId: string;
    year: number;
    shortform: boolean;
  }): Promise<{ totalCount: number; percentile: number }> {
    const startPostedAt = new Date(year, 0).toISOString();
    const endPostedAt = new Date(year + 1, 0).toISOString();
    const shortformCondition = shortform
      ? `"shortform" IS TRUE AND "topLevelCommentId" IS NULL`
      : `("shortform" IS FALSE OR "topLevelCommentId" IS NOT NULL)`;

    const result = await this.getRawDb().oneOrNone<{ total_count: string; percentile: number }>(
      `
      -- CommentsRepo.getAuthorshipStats
      WITH comment_counts AS (
        SELECT
          "userId",
          count(*) AS total_count
        FROM
          "Comments"
        WHERE
          "deleted" IS FALSE
          AND "postId" IS NOT NULL
          AND "needsReview" IS NOT TRUE
          AND "retracted" IS NOT TRUE
          AND "deletedPublic" IS NOT TRUE
          AND "moderatorHat" IS NOT TRUE
          AND ${shortformCondition}
          AND "postedAt" > $1
          AND "postedAt" < $2
        GROUP BY
          "userId"
      ), authorship_percentiles AS (
        SELECT
          "userId",
          slug,
          total_count,
          percent_rank() OVER (ORDER BY total_count ASC) percentile
        FROM
          comment_counts
          left join "Users" u on "userId" = u._id
        ORDER BY
          percentile DESC
      )
      SELECT
        total_count AS total_count,
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
}

recordPerfMetrics(CommentsRepo);

export default CommentsRepo;
