import Comments from "../../server/collections/comments/collection";
import AbstractRepo from "./AbstractRepo";
import SelectQuery from "@/server/sql/SelectQuery";
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import { filterWhereFieldsNotNull } from "../../lib/utils/typeGuardUtils";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/helpers";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { forumSelect } from "../../lib/forumTypeUtils";
import { isAF } from "../../lib/instanceSettings";
import { getViewableCommentsSelector, getViewablePostsSelector } from "./helpers";
import { FeedCommentFromDb } from "../../components/ultraFeed/ultraFeedTypes";

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
        AND p."frontpageDate" IS NOT NULL
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

  /**
   * Count the number of discussions started for EA Forum Wrapped
   * We count a "discussion" as a comment with at least 5 descendants or a post
   * with at least 5 comments
   */
  async getEAWrappedDiscussionsStarted(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.getRawDb().oneOrNone(`
      -- CommentsRepo.getEAWrappedDiscussionsStarted
      SELECT SUM("count")::INTEGER AS "discussionCount"
      FROM (
        SELECT COUNT(c.*) AS "count"
        FROM "Comments" c
        INNER JOIN "Posts" p ON
          c."postId" = p."_id"
        WHERE
          c."userId" = $1
          AND c."createdAt" > $2
          AND c."createdAt" < $3
          AND c."descendentCount" >= 5
          AND c."deleted" IS NOT TRUE
          AND c."deletedPublic" IS NOT TRUE
          AND ${getViewablePostsSelector("p")}
        UNION
        SELECT COUNT(p.*) AS "count"
        FROM "Posts" p
        WHERE
          p."userId" = $1
          AND p."postedAt" > $2
          AND p."postedAt" < $3
          AND p."commentCount" >= 5
          AND ${getViewablePostsSelector("p")}
      ) q
    `, [userId, start, end]);
    return result?.discussionCount ?? 0;
  }

  /**
   * Return an array of { commentId: string; userId: string }, where the `commentId`s correspond to
   * the parents of the given comment, starting with the most recent (and not including the comment given)
   */
  async getParentCommentIds({
    commentId,
    limit = 20,
  }: {
    commentId: string;
    limit?: number;
  }): Promise<Array<{ commentId: string; userId: string }>> {
    return this.getRawDb().any<{ commentId: string; userId: string }>(
      `
      -- CommentsRepo.getParentCommentIdsAndUserIds
      WITH RECURSIVE parent_comments AS (
        SELECT
          "parentCommentId"
        FROM
          "Comments"
        WHERE
          "_id" = $1
        UNION
        SELECT
          c."parentCommentId"
        FROM
          "Comments" c
          INNER JOIN parent_comments pc ON c."_id" = pc."parentCommentId"
      )
      SELECT
        pc."parentCommentId" AS "commentId",
        c."userId"
      FROM
        parent_comments pc
      LEFT JOIN "Comments" c ON c._id = pc."parentCommentId"
      WHERE
        pc."parentCommentId" IS NOT NULL
        AND c.deleted IS NOT TRUE
        AND c."deletedPublic" IS NOT TRUE
      ORDER BY
        c."postedAt" DESC LIMIT $2;
    `,
      [commentId, limit]
    );
  }

  async getPostReviews(postIds: string[], reviewsPerPost: number, minScore: number): Promise<DbComment[][]> {
    const comments = await this.manyOrNone(`
      -- CommentsRepo.getPostReviews
      WITH cte AS (
        SELECT
          comment_with_rownumber.*,
          ROW_NUMBER() OVER (PARTITION BY comment_with_rownumber."postId" ORDER BY comment_with_rownumber."baseScore" DESC) as rn
        FROM "Comments" comment_with_rownumber
        WHERE comment_with_rownumber."postId" IN ($1:csv)
        AND comment_with_rownumber."reviewingForReview" IS NOT NULL
        AND comment_with_rownumber."baseScore" >= $3
        AND ${getViewableCommentsSelector('comment_with_rownumber')}
      )
      SELECT *
      FROM cte
      WHERE rn <= $2
      ORDER BY "baseScore" DESC
    `, [postIds, reviewsPerPost, minScore]);
    
    const commentsByPost = groupBy(comments, c=>c.postId);
    return postIds.map(postId => commentsByPost[postId] ?? []);
  }

  async setLatestPollVote({ forumEventId, latestVote, userId }: { forumEventId: string; latestVote: number | null; userId: string; }): Promise<void> {
    await this.getRawDb().none(`
      -- CommentsRepo.setLatestPollVote
      UPDATE "Comments"
      SET "forumEventMetadata" = jsonb_set("forumEventMetadata", '{poll,latestVote}',
        CASE
          WHEN $2 IS NULL THEN 'null'::jsonb
          ELSE to_jsonb($2::float)
        END)
      WHERE "forumEventId" = $1 AND "userId" = $3
    `, [forumEventId, latestVote, userId]);
  }

  /**
   * Get comments for the UltraFeed
   */
  async getCommentsForFeed(
    userId: string,
    maxTotalComments = 1000,
    lookbackWindow = '90 days'
  ): Promise<FeedCommentFromDb[]> {
    const db = this.getRawDb();
    const initialCandidateLimit = 500;

    const getUniversalCommentFilterClause = (alias: string) => `
      ${alias}.deleted IS NOT TRUE
      AND ${alias}.retracted IS NOT TRUE
      AND ${alias}."postId" IS NOT NULL
      AND ${getViewableCommentsSelector(alias)}
    `;

    const feedCommentsData: FeedCommentFromDb[] = await db.manyOrNone(`
      -- CommentsRepo.getCommentsForFeed
      WITH "InitialCandidates" AS (
          -- Find top candidate comments based on recency or shortform status
          SELECT
              c._id AS "commentId",
              c."postId",
              COALESCE(c."topLevelCommentId", c._id) AS "threadTopLevelId",
              c."postedAt",
              c.shortform
          FROM "Comments" c
          WHERE
              ${getUniversalCommentFilterClause('c')}
              AND (c.shortform IS TRUE OR c."postedAt" > (NOW() - INTERVAL '7 days'))
          ORDER BY c."postedAt" DESC
          LIMIT $(initialCandidateLimit)
      ),
      "CandidateThreadTopLevelIds" AS (
          SELECT DISTINCT "threadTopLevelId" FROM "InitialCandidates"
      ),
      "AllRelevantComments" AS (
          -- Fetch all comments belonging to the candidate threads using the distinct IDs
          SELECT
            c._id,
            c."postId",
            c."baseScore",
            c."topLevelCommentId",
            c."parentCommentId",
            c.shortform,
            c."postedAt"
          FROM "Comments" c
          JOIN "CandidateThreadTopLevelIds" ct
              ON c."topLevelCommentId" = ct."threadTopLevelId"
              OR (c._id = ct."threadTopLevelId" AND c."topLevelCommentId" IS NULL)
          WHERE
              ${getUniversalCommentFilterClause('c')}
      ),
      "UsersEvents" AS (
         -- Fetch latest interaction/view/served events for the relevant comments for the specific user
         SELECT
             ue."documentId",
             ue."createdAt",
             ue."eventType"
         FROM "UltraFeedEvents" ue
         WHERE 1=1
         AND ue."collectionName" = 'Comments'
         AND "userId" = $(userId) -- Parameterized userId
         AND (ue."eventType" <> 'served' OR ue."createdAt" > current_timestamp - INTERVAL '48 hours')
         AND ue."documentId" IN (SELECT _id FROM "AllRelevantComments")
         ORDER BY (CASE WHEN ue."eventType" = 'served' THEN 1 ELSE 0 END) ASC
         LIMIT 5000
      ),
      "CommentEvents" AS (
          -- Aggregate the user's latest events for each comment
          SELECT
              ce."documentId",
              MAX(CASE WHEN ce."eventType" = 'viewed' THEN ce."createdAt" ELSE NULL END) AS "lastViewed",
              MAX(CASE WHEN ce."eventType" <> 'viewed' AND ce."eventType" <> 'served' THEN ce."createdAt" ELSE NULL END) AS "lastInteracted",
              MAX(CASE WHEN ce."eventType" = 'served' THEN ce."createdAt" ELSE NULL END) AS "lastServed"
         FROM "UsersEvents" ce
          GROUP BY ce."documentId"
      )
      -- Final Selection and Ordering
      SELECT
          c._id AS "commentId",
          c."postId",
          c."baseScore",
          COALESCE(c."topLevelCommentId", c._id) AS "topLevelCommentId", -- Ensure topLevelCommentId is always populated
          c."parentCommentId",
          c.shortform,
          c."postedAt",
          ce."lastServed",
          ce."lastViewed",
          ce."lastInteracted"
      FROM "AllRelevantComments" c
      LEFT JOIN "CommentEvents" ce ON c._id = ce."documentId"
      ORDER BY COALESCE(c."topLevelCommentId", c._id), c."postedAt"
      LIMIT $(maxTotalComments) -- Apply final limit
    `, { userId, initialCandidateLimit, maxTotalComments });

    return feedCommentsData.map((comment): FeedCommentFromDb => ({
      commentId: comment.commentId,
      topLevelCommentId: comment.topLevelCommentId,
      parentCommentId: comment.parentCommentId ?? null,
      postId: comment.postId,
      baseScore: comment.baseScore,
      shortform: comment.shortform ?? null,
      postedAt: comment.postedAt,
      sources: ['recentComments'], // Assign fixed source
      lastServed: null, 
      lastViewed: comment.lastViewed ?? null,
      lastInteracted: comment.lastInteracted ?? null,
    }));
  }
}

recordPerfMetrics(CommentsRepo);

export default CommentsRepo;
