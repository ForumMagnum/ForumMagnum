import Comments from "../../server/collections/comments/collection";
import AbstractRepo from "./AbstractRepo";
import SelectQuery from "@/server/sql/SelectQuery";
import keyBy from 'lodash/keyBy';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import { filterWhereFieldsNotNull } from "../../lib/utils/typeGuardUtils";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { isAF } from "../../lib/instanceSettings";
import { getViewableCommentsSelector, getViewablePostsSelector } from "./helpers";
import {
  aiDigestActiveAuthorSubscriptionConditions,
  aiDigestActiveSeeLessExistsSubquery,
  aiDigestPositiveVoteLateralSubquery,
  aiDigestPositiveVoteStrengthSubquery,
} from "./aiDigestSqlFragments";
import { FeedCommentFromDb, ThreadEngagementStats } from "../../components/ultraFeed/ultraFeedTypes";
import { REVIEW_YEAR } from "@/lib/reviewUtils";

type ExtendedCommentWithReactions = DbComment & {
  yourVote?: string,
  theirVote?: string,
  userVote?: string,
}

export interface AiDigestQuickTakeCandidateRow {
  commentId: string;
  author: string;
  authorId: string | null;
  publicationDate: Date;
  baseScore: number;
  revisionHtml: string;
}

export interface AiDigestQuickTakeAnnotationRow {
  commentId: string;
  isSubscribedToAuthor: boolean;
  positivePreferenceStrength: "regular" | "strong" | null;
  hasActiveSeeLess: boolean;
  recipientAuthored: boolean;
}

export interface AiDigestQuickTakeInteractionRow {
  commentId: string;
  author: string;
  publicationDate: Date;
  revisionHtml: string;
  positivePreferenceStrength: "regular" | "strong" | null;
  positivePreferenceAt: Date | null;
  repliedAt: Date | null;
}

export interface AiDigestSiteWideThreadRow {
  threadId: string;
  topCommentKarma: number;
}

export interface AiDigestReaderThreadRow {
  threadId: string;
  participated: boolean;
  newCommentCount: number;
  topCommentKarma: number;
}

export interface AiDigestThreadCommentRow {
  commentId: string;
  threadId: string;
  parentCommentId: string | null;
  postId: string | null;
  postTitle: string | null;
  postBaseScore: number | null;
  author: string;
  authorId: string | null;
  publicationDate: Date;
  baseScore: number;
  revisionHtml: string;
}

export interface AiDigestThreadCommentAnnotationRow {
  commentId: string;
  authoredByReader: boolean;
  positivePreferenceStrength: "regular" | "strong" | null;
  newSinceLastVisit: boolean;
  seenInFeed: boolean;
  hasActiveSeeLess: boolean;
  onReaderAuthoredPost: boolean;
  replyToReaderComment: boolean;
}

/**
 * Shared visibility filter for AI digest thread candidates, mirroring the
 * quick-take candidate policy: no deleted/rejected/retracted/draft/needs-review/
 * unreviewed comments, and no moderator-hat comments.
 */
const aiDigestThreadCommentFilters = (alias: string) => `
  ${alias}.deleted IS FALSE
  AND ${alias}.rejected IS FALSE
  AND ${alias}.retracted IS FALSE
  AND ${alias}.draft IS NOT TRUE
  AND COALESCE(${alias}."needsReview", FALSE) IS FALSE
  AND ${alias}."moderatorHat" IS FALSE
  AND ${alias}."authorIsUnreviewed" IS FALSE
  AND ${alias}."debateResponse" IS NOT TRUE
  AND ${alias}."postId" IS NOT NULL
  AND ${alias}."postedAt" IS NOT NULL
  AND ${alias}."postedAt" <= NOW()
`;

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
    const lookbackPeriod = isAF() ? '1 month' : '1 week';
    const afCommentsFilter = isAF() ? 'AND "af" IS TRUE' : '';

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
        COALESCE(c."draft", FALSE) AS "draft",
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

  /**
   * Get comments for the UltraFeed
   */
  async getCommentsForFeed(
    userIdOrClientId: string,
    maxTotalComments = 1000,
    initialCandidateLookbackDays: number,
    commentServedEventRecencyHours: number,
    restrictCandidatesToSubscribed = false,
  ): Promise<FeedCommentFromDb[]> {
    const initialCandidateLimit = 500;

    const getUniversalCommentFilterClause = (alias: string) => `
      ${alias}.deleted IS NOT TRUE
      AND ${alias}.retracted IS NOT TRUE
      AND ${alias}."postId" IS NOT NULL
      AND ${getViewableCommentsSelector(alias)}
    `;

    const feedCommentsData: FeedCommentFromDb[] = await this.getRawDb().manyOrNone(`
      -- CommentsRepo.getCommentsForFeed
      WITH "SubscribedAuthorIds" AS (
          -- Get all user IDs the current user is subscribed to
          SELECT DISTINCT "documentId" AS "authorId"
          FROM "Subscriptions"
          WHERE "userId" = $(userIdOrClientId)
            AND "collectionName" = 'Users'
            AND "state" = 'subscribed'
            AND "type" IN ('newActivityForFeed', 'newPosts', 'newComments')
            AND deleted IS NOT TRUE
      ),
      "InitialCandidates" AS (
          -- Find top candidate comments based on recency or shortform status
          SELECT
              c._id AS "commentId",
              c."postId",
              COALESCE(c."topLevelCommentId", c._id) AS "threadTopLevelId",
              c."postedAt",
              c.shortform,
              c."userId" AS "authorId"
          FROM "Comments" c
          INNER JOIN "Posts" p ON c."postId" = p._id
          WHERE
              ${getUniversalCommentFilterClause('c')}
              AND c."userId" != $(userIdOrClientId)
              AND c."postedAt" > (NOW() - INTERVAL '1 day' * $(initialCandidateLookbackDaysParam))
              AND p.draft IS NOT TRUE
              AND (CASE WHEN $(restrictCandidatesToSubscribed) THEN c."userId" IN (SELECT "authorId" FROM "SubscribedAuthorIds") ELSE TRUE END)
          ORDER BY 
              (CASE WHEN c."reviewingForReview" = $(reviewYear) THEN 0 ELSE 1 END),
              c."postedAt" DESC
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
              c."userId" AS "authorId",
              c."baseScore",
              c."topLevelCommentId",
              c."parentCommentId",
              c.shortform,
              c."postedAt",
              c."descendentCount",
              c."reviewingForReview",
              CASE 
                WHEN c.shortform IS TRUE THEN 'quicktakes'
                WHEN sa."authorId" IS NOT NULL THEN 'subscriptionsComments'
                ELSE 'recentComments'
              END AS "primarySource",
              CASE WHEN sa."authorId" IS NOT NULL THEN TRUE ELSE FALSE END AS "fromSubscribedUser",
              (ic."commentId" IS NOT NULL) AS "isInitialCandidate"
          FROM "Comments" c
          JOIN "CandidateThreadTopLevelIds" ct
              ON c."topLevelCommentId" = ct."threadTopLevelId"
              OR (c._id = ct."threadTopLevelId" AND c."topLevelCommentId" IS NULL)
          LEFT JOIN "SubscribedAuthorIds" sa ON c."userId" = sa."authorId"
          LEFT JOIN "InitialCandidates" ic ON c._id = ic."commentId"
          WHERE
              ${getUniversalCommentFilterClause('c')}
      ),
      "ReadStatusViews" AS (
        -- Generate implied view events from ReadStatuses table
        SELECT
          c._id AS "documentId",
          rs."lastUpdated" AS "createdAt",
          'viewed' AS "eventType"
        FROM "AllRelevantComments" c
        JOIN "ReadStatuses" rs ON c."postId" = rs."postId"
        WHERE rs."userId" = $(userIdOrClientId)
          AND rs."isRead" IS TRUE
          AND c."postedAt" < rs."lastUpdated"
      ),
      "UsersEvents" AS (
        -- Select from the combined and ordered events
        SELECT * FROM (
          -- Combine both real events and implied events from read statuses
          SELECT
            ue."documentId",
            ue."createdAt",
            ue."eventType"
          FROM "UltraFeedEvents" ue
          WHERE ue."collectionName" = 'Comments'
            AND "userId" = $(userIdOrClientId)
            AND (ue."eventType" <> 'served' OR ue."createdAt" > current_timestamp - INTERVAL '1 hour' * $(commentServedEventRecencyHoursParam))
            AND ue."documentId" IN (SELECT _id FROM "AllRelevantComments")
          
          UNION ALL
          
          -- Add the implied view events from ReadStatuses
          SELECT * FROM "ReadStatusViews"
        ) AS CombinedEvents -- Treat the UNION result as a derived table
        ORDER BY (CASE WHEN "eventType" = 'served' THEN 1 ELSE 0 END) ASC
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
          c."authorId",
          c."baseScore",
          COALESCE(c."topLevelCommentId", c._id) AS "topLevelCommentId", -- Ensure topLevelCommentId is always populated
          c."parentCommentId",
          c.shortform,
          c."postedAt",
          c."descendentCount",
          c."reviewingForReview",
          c."primarySource",
          c."fromSubscribedUser",
          c."isInitialCandidate",
          ce."lastServed",
          ce."lastViewed",
          ce."lastInteracted",
          (ce."lastViewed" IS NOT NULL OR ce."lastInteracted" IS NOT NULL) AS "isRead"
      FROM "AllRelevantComments" c
      LEFT JOIN "CommentEvents" ce ON c._id = ce."documentId"
      ORDER BY COALESCE(c."topLevelCommentId", c._id), c."postedAt"
      LIMIT $(maxTotalComments) -- Apply final limit
    `, { 
      userIdOrClientId, 
      initialCandidateLimit, 
      maxTotalComments,
      initialCandidateLookbackDaysParam: initialCandidateLookbackDays,
      commentServedEventRecencyHoursParam: commentServedEventRecencyHours,
      restrictCandidatesToSubscribed,
      reviewYear: REVIEW_YEAR.toString(),
    });

    // Safety check for duplicates from the database query
    const uniqueMap = new Map(feedCommentsData.map(c => [c.commentId, c]));
    if (uniqueMap.size < feedCommentsData.length) {
      // eslint-disable-next-line no-console
      console.warn(`[CommentsRepo.getCommentsForFeed] Deduplicated from ${feedCommentsData.length} to ${uniqueMap.size} comments`);
    }
    const deduplicatedComments = Array.from(uniqueMap.values());

    return deduplicatedComments.map((comment): FeedCommentFromDb => {
      const sources: string[] = [comment.primarySource ?? 'recentComments'];
      return {
        commentId: comment.commentId,
        authorId: comment.authorId,
        topLevelCommentId: comment.topLevelCommentId,
        parentCommentId: comment.parentCommentId ?? null,
        postId: comment.postId,
        baseScore: comment.baseScore,
        shortform: comment.shortform ?? null,
        postedAt: comment.postedAt,
        descendentCount: comment.descendentCount,
        sources,
        primarySource: comment.primarySource,
        isInitialCandidate: comment.isInitialCandidate,
        fromSubscribedUser: !!comment.fromSubscribedUser,
        lastServed: null,
        lastViewed: comment.lastViewed ?? null,
        lastInteracted: comment.lastInteracted ?? null,
        isRead: !!comment.isRead,
        reviewingForReview: comment.reviewingForReview ?? null,
      };
    });
  }

  /**
   * Fetches consolidated engagement statistics for recently active comment threads.
   */
  async getThreadEngagementStatsForRecentlyActiveThreads(
    userIdOrClientId: string,
    threadEngagementLookbackDays: number,
    sessionId?: string | null
  ): Promise<ThreadEngagementStats[]> {
    const threadCandidateLimit = 200; // Hardcoded
    const lookbackInterval = `${threadEngagementLookbackDays} days`;

    const getViewableCommentsFilter = (alias: string) => `
      ${alias}."postedAt" > (NOW() - INTERVAL $(lookbackInterval))
      AND ${alias}.deleted IS NOT TRUE
      AND ${alias}.retracted IS NOT TRUE
      AND ${getViewableCommentsSelector(alias)}
    `;

    const engagementStats = await this.getRawDb().manyOrNone<ThreadEngagementStats>(`
      -- CommentsRepo.getThreadEngagementStatsForRecentlyActiveThreads
      SELECT
        recentActiveThreads."threadTopLevelId",
        COALESCE(userVotesInThreads."votingActivityScore", 0) AS "votingActivityScore",
        COALESCE(userCommentsInThreads."participationCount", 0) AS "participationCount",
        COALESCE(userViewEventsInThreads."viewScore", 0) AS "viewScore",
        CASE WHEN threadsOnReadPosts."threadTopLevelId" IS NOT NULL THEN TRUE ELSE FALSE END AS "isOnReadPost",
        COALESCE(recentServings."recentServingCount", 0) AS "recentServingCount",
        COALESCE(recentServings."servingHoursAgo", ARRAY[]::numeric[]) AS "servingHoursAgo"
      FROM
        ( -- get threads with any recent activity
          SELECT "threadTopLevelId"
          FROM (
            SELECT COALESCE(c."topLevelCommentId", c._id) AS "threadTopLevelId", MAX(c."postedAt") as "lastCommentActivity"
            FROM "Comments" c
            WHERE ${getViewableCommentsFilter('c')}
            GROUP BY COALESCE(c."topLevelCommentId", c._id)
            ORDER BY "lastCommentActivity" DESC
            LIMIT $(threadCandidateLimit)
          ) recent_threads_subquery
        ) recentActiveThreads
      LEFT JOIN
        ( -- get a users recent votes on threads
          SELECT
            COALESCE(c_votes."topLevelCommentId", c_votes._id) AS "threadTopLevelId",
            SUM(CASE WHEN v."voteType" = 'bigUpvote' THEN 5 ELSE 1 END) AS "votingActivityScore"
          FROM "Votes" v
          JOIN "Comments" c_votes ON v."documentId" = c_votes._id
          WHERE v."userId" = $(userIdOrClientId)
            AND v."collectionName" = 'Comments'
            AND v.power > 0 -- Or your updated v."voteType" IN ('smallUpvote', 'bigUpvote') condition
            AND v."cancelled" IS NOT TRUE
            AND v."isUnvote" IS NOT TRUE
            AND v."votedAt" > (NOW() - INTERVAL $(lookbackInterval))
            AND COALESCE(c_votes."topLevelCommentId", c_votes._id) IN (
                SELECT "threadTopLevelId_inner_rat" FROM (
                    SELECT COALESCE(c_inner."topLevelCommentId", c_inner._id) AS "threadTopLevelId_inner_rat", MAX(c_inner."postedAt") AS "lastCommentActivity_inner"
                    FROM "Comments" c_inner
                    WHERE ${getViewableCommentsFilter('c_inner')}
                    GROUP BY COALESCE(c_inner."topLevelCommentId", c_inner._id)
                    ORDER BY "lastCommentActivity_inner" DESC
                    LIMIT $(threadCandidateLimit)
                ) recent_threads_filter_for_uvt
            )
          GROUP BY COALESCE(c_votes."topLevelCommentId", c_votes._id)
        ) userVotesInThreads ON recentActiveThreads."threadTopLevelId" = userVotesInThreads."threadTopLevelId"
      LEFT JOIN
        ( -- get a users recent comments on threads
          SELECT
            COALESCE(c_comments."topLevelCommentId", c_comments._id) AS "threadTopLevelId",
            COUNT(*) AS "participationCount"
          FROM "Comments" c_comments
          WHERE c_comments."userId" = $(userIdOrClientId)
            AND c_comments.deleted IS NOT TRUE
            AND c_comments."postedAt" > (NOW() - INTERVAL $(lookbackInterval))
            AND COALESCE(c_comments."topLevelCommentId", c_comments._id) IN (
                SELECT "threadTopLevelId_inner_rat" FROM (
                    SELECT COALESCE(c_inner."topLevelCommentId", c_inner._id) AS "threadTopLevelId_inner_rat", MAX(c_inner."postedAt") AS "lastCommentActivity_inner"
                    FROM "Comments" c_inner
                    WHERE ${getViewableCommentsFilter('c_inner')}
                    GROUP BY COALESCE(c_inner."topLevelCommentId", c_inner._id)
                    ORDER BY "lastCommentActivity_inner" DESC
                    LIMIT $(threadCandidateLimit)
                ) recent_threads_filter_for_uct
            )
          GROUP BY COALESCE(c_comments."topLevelCommentId", c_comments._id)
        ) userCommentsInThreads ON recentActiveThreads."threadTopLevelId" = userCommentsInThreads."threadTopLevelId"
      LEFT JOIN
        ( -- get a users recent view events on threads
          SELECT
            COALESCE(c_views."topLevelCommentId", c_views._id) AS "threadTopLevelId",
            SUM(CASE
                WHEN ufe."eventType" = 'viewed' THEN 1
                WHEN ufe."eventType" = 'expanded' THEN 3
                ELSE 0
            END) AS "viewScore"
          FROM "UltraFeedEvents" ufe
          JOIN "Comments" c_views ON ufe."documentId" = c_views._id
          WHERE ufe."userId" = $(userIdOrClientId)
            AND ufe."eventType" != 'served'
            AND ufe."collectionName" = 'Comments'
            AND ufe."createdAt" > (NOW() - INTERVAL $(lookbackInterval))
            AND COALESCE(c_views."topLevelCommentId", c_views._id) IN (
                SELECT "threadTopLevelId_inner_rat" FROM (
                    SELECT COALESCE(c_inner."topLevelCommentId", c_inner._id) AS "threadTopLevelId_inner_rat", MAX(c_inner."postedAt") AS "lastCommentActivity_inner"
                    FROM "Comments" c_inner
                    WHERE ${getViewableCommentsFilter('c_inner')}
                    GROUP BY COALESCE(c_inner."topLevelCommentId", c_inner._id)
                    ORDER BY "lastCommentActivity_inner" DESC
                    LIMIT $(threadCandidateLimit)
                ) recent_threads_filter_for_uve
            )
          GROUP BY COALESCE(c_views."topLevelCommentId", c_views._id)
        ) userViewEventsInThreads ON recentActiveThreads."threadTopLevelId" = userViewEventsInThreads."threadTopLevelId"
      LEFT JOIN
        ( -- get threads that are on posts read by the user
          SELECT DISTINCT COALESCE(c_read."topLevelCommentId", c_read._id) AS "threadTopLevelId"
          FROM "Comments" c_read
          JOIN (
            SELECT "postId"
            FROM "ReadStatuses" rs
            WHERE rs."userId" = $(userIdOrClientId)
              AND rs."isRead" IS TRUE
              AND rs."lastUpdated" > (NOW() - INTERVAL $(lookbackInterval))
            UNION DISTINCT
            SELECT DISTINCT "documentId" AS "postId"
            FROM "UltraFeedEvents" ufe_posts
            WHERE ufe_posts."userId" = $(userIdOrClientId)
              AND ufe_posts."collectionName" = 'Posts'
              AND ufe_posts."eventType" != 'served'
              AND ufe_posts."createdAt" > (NOW() - INTERVAL $(lookbackInterval))
          ) "readPosts_subquery" ON c_read."postId" = "readPosts_subquery"."postId"
          WHERE c_read."postedAt" > (NOW() - INTERVAL $(lookbackInterval))
            AND COALESCE(c_read."topLevelCommentId", c_read._id) IN (
                SELECT "threadTopLevelId_inner_rat" FROM (
                    SELECT COALESCE(c_inner."topLevelCommentId", c_inner._id) AS "threadTopLevelId_inner_rat", MAX(c_inner."postedAt") AS "lastCommentActivity_inner"
                    FROM "Comments" c_inner
                    WHERE ${getViewableCommentsFilter('c_inner')}
                    GROUP BY COALESCE(c_inner."topLevelCommentId", c_inner._id)
                    ORDER BY "lastCommentActivity_inner" DESC
                    LIMIT $(threadCandidateLimit)
                ) recent_threads_filter_for_torp
            )
        ) threadsOnReadPosts ON recentActiveThreads."threadTopLevelId" = threadsOnReadPosts."threadTopLevelId"
      LEFT JOIN
        ( -- get repeated thread exposures to calculate repetition penalty
          SELECT
            COALESCE(c_repetition."topLevelCommentId", c_repetition._id) AS "threadTopLevelId",
            COUNT(DISTINCT ufe_repetition."createdAt") AS "recentServingCount",
            ARRAY_AGG(
              EXTRACT(EPOCH FROM (NOW() - ufe_repetition."createdAt")) / 3600 
              ORDER BY ufe_repetition."createdAt" DESC
            ) AS "servingHoursAgo"
          FROM "UltraFeedEvents" ufe_repetition
          JOIN "Comments" c_repetition ON ufe_repetition."documentId" = c_repetition._id
          WHERE ufe_repetition."userId" = $(userIdOrClientId)
            AND ufe_repetition."collectionName" = 'Comments'
            AND ufe_repetition."createdAt" > (NOW() - INTERVAL '6 hours') -- Shorter lookback for repetition
            AND (
              (
                ufe_repetition."eventType" = 'served'
                AND $(sessionId) IS NOT NULL
                AND ufe_repetition.event->>'sessionId' = $(sessionId)
              )
              OR ufe_repetition."eventType" = 'viewed'
            )
            AND COALESCE(c_repetition."topLevelCommentId", c_repetition._id) IN (
                SELECT "threadTopLevelId_inner_rat" FROM (
                    SELECT COALESCE(c_inner."topLevelCommentId", c_inner._id) AS "threadTopLevelId_inner_rat", MAX(c_inner."postedAt") AS "lastCommentActivity_inner"
                    FROM "Comments" c_inner
                    WHERE ${getViewableCommentsFilter('c_inner')}
                    GROUP BY COALESCE(c_inner."topLevelCommentId", c_inner._id)
                    ORDER BY "lastCommentActivity_inner" DESC
                    LIMIT $(threadCandidateLimit)
                ) recent_threads_filter_for_servings
            )
          GROUP BY COALESCE(c_repetition."topLevelCommentId", c_repetition._id)
        ) recentServings ON recentActiveThreads."threadTopLevelId" = recentServings."threadTopLevelId"
    `, {
      userIdOrClientId,
      lookbackInterval,
      threadCandidateLimit,
      sessionId: sessionId ?? null,
    });

    return engagementStats;
  }

  async getAiDigestQuickTakeCandidateRows({
    minPostedAt,
    minKarma,
    limit,
  }: {
    minPostedAt: Date;
    minKarma: number;
    limit: number;
  }): Promise<AiDigestQuickTakeCandidateRow[]> {
    return this.getRawDb().manyOrNone<AiDigestQuickTakeCandidateRow>(`
      -- CommentsRepo.getAiDigestQuickTakeCandidateRows
      SELECT
        c."_id" AS "commentId",
        COALESCE(u."displayName", c.author, 'LessWrong contributor') AS author,
        c."userId" AS "authorId",
        c."postedAt" AS "publicationDate",
        c."baseScore",
        r.html AS "revisionHtml"
      FROM "Comments" c
      INNER JOIN "Revisions" r ON r."_id" = c."contents_latest"
      LEFT JOIN "Users" u ON u."_id" = c."userId"
      WHERE c.shortform IS TRUE
        AND c."topLevelCommentId" IS NULL
        AND c.deleted IS FALSE
        AND c.rejected IS FALSE
        AND c.retracted IS FALSE
        AND c.draft IS NOT TRUE
        AND COALESCE(c."needsReview", FALSE) IS FALSE
        AND c."moderatorHat" IS FALSE
        AND c."authorIsUnreviewed" IS FALSE
        AND c."postedAt" IS NOT NULL
        AND c."postedAt" <= NOW()
        AND c."postedAt" >= $(minPostedAt)
        AND c."baseScore" >= $(minKarma)
        AND c."contents_latest" IS NOT NULL
        AND length(trim(r.html)) > 0
      ORDER BY c."baseScore" DESC, c."postedAt" DESC, c."_id"
      LIMIT $(limit)
    `, {
      minPostedAt,
      minKarma,
      limit,
    });
  }

  async getAiDigestQuickTakeAnnotationRows({
    userId,
    commentIds,
  }: {
    userId: string;
    commentIds: string[];
  }): Promise<AiDigestQuickTakeAnnotationRow[]> {
    if (commentIds.length === 0) {
      return [];
    }
    return this.getRawDb().manyOrNone<AiDigestQuickTakeAnnotationRow>(`
      -- CommentsRepo.getAiDigestQuickTakeAnnotationRows
      SELECT
        c."_id" AS "commentId",
        EXISTS (
          SELECT 1
          FROM "Subscriptions" s
          WHERE ${aiDigestActiveAuthorSubscriptionConditions("s")}
            AND s."documentId" = c."userId"
        ) AS "isSubscribedToAuthor",
        ${aiDigestPositiveVoteStrengthSubquery({ collectionName: "Comments", documentIdExpression: `c."_id"` })} AS "positivePreferenceStrength",
        ${aiDigestActiveSeeLessExistsSubquery({ collectionName: "Comments", documentIdExpression: `c."_id"` })} AS "hasActiveSeeLess",
        (c."userId" = $(userId)) AS "recipientAuthored"
      FROM "Comments" c
      WHERE c."_id" = ANY($(commentIds)::text[])
    `, {
      userId,
      commentIds,
    });
  }

  async getAiDigestQuickTakeInteractionRows({
    userId,
    commentIds,
  }: {
    userId: string;
    commentIds: string[];
  }): Promise<AiDigestQuickTakeInteractionRow[]> {
    if (commentIds.length === 0) {
      return [];
    }
    return this.getRawDb().manyOrNone<AiDigestQuickTakeInteractionRow>(`
      -- CommentsRepo.getAiDigestQuickTakeInteractionRows
      SELECT
        c."_id" AS "commentId",
        COALESCE(u."displayName", c.author, 'LessWrong contributor') AS author,
        c."postedAt" AS "publicationDate",
        r.html AS "revisionHtml",
        positive_vote."positivePreferenceStrength",
        positive_vote."positivePreferenceAt",
        reply."repliedAt"
      FROM "Comments" c
      INNER JOIN "Revisions" r ON r."_id" = c."contents_latest"
      LEFT JOIN "Users" u ON u."_id" = c."userId"
      LEFT JOIN LATERAL ${aiDigestPositiveVoteLateralSubquery({ collectionName: "Comments", documentIdExpression: `c."_id"` })} positive_vote ON TRUE
      LEFT JOIN LATERAL (
        SELECT MIN(reply."postedAt") AS "repliedAt"
        FROM "Comments" reply
        WHERE reply."userId" = $(userId)
          AND reply.deleted IS FALSE
          AND reply.rejected IS FALSE
          AND reply.draft IS NOT TRUE
          AND (
            reply."topLevelCommentId" = c."_id"
            OR reply."parentCommentId" = c."_id"
          )
      ) reply ON TRUE
      WHERE c."_id" = ANY($(commentIds)::text[])
        AND c."postedAt" IS NOT NULL
        AND c."contents_latest" IS NOT NULL
    `, { userId, commentIds });
  }

  /**
   * Top recent comment threads site-wide, grouped by top-level comment and
   * ranked by the highest comment karma within the candidate window. This pool
   * is shared across all AI digest readers.
   */
  async getAiDigestSiteWideThreadRows({
    minPostedAt,
    limit,
  }: {
    minPostedAt: Date;
    limit: number;
  }): Promise<AiDigestSiteWideThreadRow[]> {
    return this.getRawDb().manyOrNone<AiDigestSiteWideThreadRow>(`
      -- CommentsRepo.getAiDigestSiteWideThreadRows
      SELECT
        COALESCE(c."topLevelCommentId", c."_id") AS "threadId",
        MAX(c."baseScore") AS "topCommentKarma"
      FROM "Comments" c
      JOIN "Posts" p ON p."_id" = c."postId"
      WHERE ${aiDigestThreadCommentFilters("c")}
        AND c."postedAt" >= $(minPostedAt)
        AND ${getViewablePostsSelector("p")}
      GROUP BY COALESCE(c."topLevelCommentId", c."_id")
      ORDER BY MAX(c."baseScore") DESC, COALESCE(c."topLevelCommentId", c."_id")
      LIMIT $(limit)
    `, {
      minPostedAt,
      limit,
    });
  }

  /**
   * Recent comment threads relevant to one reader: threads they participated in
   * (authored or upvoted a comment), plus threads on posts they read or upvoted
   * that have comments the reader has not seen (posted after the post's
   * ReadStatuses.lastUpdated). Participated threads rank first; the rest rank by
   * new-comment count times top-comment karma so heavy readers' pools are not
   * dominated by whichever big posts they happened to open.
   */
  async getAiDigestReaderThreadRows({
    userId,
    minPostedAt,
    limit,
  }: {
    userId: string;
    minPostedAt: Date;
    limit: number;
  }): Promise<AiDigestReaderThreadRow[]> {
    return this.getRawDb().manyOrNone<AiDigestReaderThreadRow>(`
      -- CommentsRepo.getAiDigestReaderThreadRows
      WITH reader_read_posts AS (
        SELECT rs."postId", MAX(rs."lastUpdated") AS "lastUpdated"
        FROM "ReadStatuses" rs
        WHERE rs."userId" = $(userId)
          AND rs."isRead" IS TRUE
          AND rs."postId" IS NOT NULL
        GROUP BY rs."postId"
      ),
      reader_upvoted_posts AS (
        SELECT DISTINCT v."documentId" AS "postId"
        FROM "Votes" v
        WHERE v."userId" = $(userId)
          AND v."collectionName" = 'Posts'
          AND v."voteType" IN ('smallUpvote', 'bigUpvote')
          AND v.cancelled IS FALSE
          AND v."isUnvote" IS FALSE
      ),
      participated_threads AS (
        SELECT DISTINCT COALESCE(c."topLevelCommentId", c."_id") AS "threadId"
        FROM "Comments" c
        WHERE c."userId" = $(userId)
          AND c.deleted IS FALSE
          AND c.draft IS NOT TRUE
        UNION
        SELECT DISTINCT COALESCE(c."topLevelCommentId", c."_id") AS "threadId"
        FROM "Votes" v
        JOIN "Comments" c ON c."_id" = v."documentId"
        WHERE v."userId" = $(userId)
          AND v."collectionName" = 'Comments'
          AND v."voteType" IN ('smallUpvote', 'bigUpvote')
          AND v.cancelled IS FALSE
          AND v."isUnvote" IS FALSE
      ),
      thread_stats AS (
        SELECT
          COALESCE(c."topLevelCommentId", c."_id") AS "threadId",
          MAX(c."baseScore") AS "topCommentKarma",
          COUNT(*) FILTER (
            WHERE rrp."lastUpdated" IS NULL OR c."postedAt" > rrp."lastUpdated"
          )::integer AS "newCommentCount",
          BOOL_OR(pt."threadId" IS NOT NULL) AS "participated",
          BOOL_OR(rrp."postId" IS NOT NULL OR rup."postId" IS NOT NULL) AS "onEngagedPost"
        FROM "Comments" c
        JOIN "Posts" p ON p."_id" = c."postId"
        LEFT JOIN reader_read_posts rrp ON rrp."postId" = c."postId"
        LEFT JOIN reader_upvoted_posts rup ON rup."postId" = c."postId"
        LEFT JOIN participated_threads pt
          ON pt."threadId" = COALESCE(c."topLevelCommentId", c."_id")
        WHERE ${aiDigestThreadCommentFilters("c")}
          AND c."postedAt" >= $(minPostedAt)
          AND ${getViewablePostsSelector("p")}
        GROUP BY COALESCE(c."topLevelCommentId", c."_id")
      )
      SELECT
        ts."threadId",
        ts."participated",
        ts."newCommentCount",
        ts."topCommentKarma"
      FROM thread_stats ts
      WHERE ts."participated"
        OR (ts."onEngagedPost" AND ts."newCommentCount" > 0)
      ORDER BY
        ts."participated" DESC,
        ts."newCommentCount" * GREATEST(ts."topCommentKarma", 0) DESC,
        ts."threadId"
      LIMIT $(limit)
    `, {
      userId,
      minPostedAt,
      limit,
    });
  }

  /**
   * All visible comments (bounded per thread, root first then karma) for the
   * supplied AI digest candidate threads, with post context for card headers.
   */
  async getAiDigestThreadCommentRows({
    threadIds,
    perThreadLimit,
  }: {
    threadIds: string[];
    perThreadLimit: number;
  }): Promise<AiDigestThreadCommentRow[]> {
    if (threadIds.length === 0) {
      return [];
    }
    return this.getRawDb().manyOrNone<AiDigestThreadCommentRow>(`
      -- CommentsRepo.getAiDigestThreadCommentRows
      SELECT
        "commentId",
        "threadId",
        "parentCommentId",
        "postId",
        "postTitle",
        "postBaseScore",
        author,
        "authorId",
        "publicationDate",
        "baseScore",
        "revisionHtml"
      FROM (
        SELECT
          c."_id" AS "commentId",
          COALESCE(c."topLevelCommentId", c."_id") AS "threadId",
          c."parentCommentId",
          c."postId",
          p."title" AS "postTitle",
          p."baseScore" AS "postBaseScore",
          COALESCE(u."displayName", c.author, 'LessWrong contributor') AS author,
          c."userId" AS "authorId",
          c."postedAt" AS "publicationDate",
          c."baseScore",
          r.html AS "revisionHtml",
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(c."topLevelCommentId", c."_id")
            ORDER BY
              (c."_id" = COALESCE(c."topLevelCommentId", c."_id")) DESC,
              c."baseScore" DESC,
              c."postedAt",
              c."_id"
          ) AS row_number
        FROM "Comments" c
        INNER JOIN "Revisions" r ON r."_id" = c."contents_latest"
        LEFT JOIN "Users" u ON u."_id" = c."userId"
        LEFT JOIN "Posts" p ON p."_id" = c."postId"
        WHERE COALESCE(c."topLevelCommentId", c."_id") = ANY($(threadIds)::text[])
          AND ${aiDigestThreadCommentFilters("c")}
          AND c."contents_latest" IS NOT NULL
          AND length(trim(r.html)) > 0
      ) bounded_thread_comments
      WHERE row_number <= $(perThreadLimit)
    `, {
      threadIds,
      perThreadLimit,
    });
  }

  /**
   * Per-reader annotations for AI digest thread comments: authorship, upvotes,
   * unseen-ness relative to the post's read status, UltraFeed viewed/expanded
   * suppression, see-less feedback, and the notification-covered relationships
   * that make a comment ineligible as a thread anchor.
   */
  async getAiDigestThreadCommentAnnotationRows({
    userId,
    commentIds,
  }: {
    userId: string;
    commentIds: string[];
  }): Promise<AiDigestThreadCommentAnnotationRow[]> {
    if (commentIds.length === 0) {
      return [];
    }
    return this.getRawDb().manyOrNone<AiDigestThreadCommentAnnotationRow>(`
      -- CommentsRepo.getAiDigestThreadCommentAnnotationRows
      SELECT
        c."_id" AS "commentId",
        (c."userId" = $(userId)) AS "authoredByReader",
        ${aiDigestPositiveVoteStrengthSubquery({ collectionName: "Comments", documentIdExpression: `c."_id"` })} AS "positivePreferenceStrength",
        COALESCE(rs."isRead" IS TRUE AND c."postedAt" > rs."lastUpdated", FALSE)
          AS "newSinceLastVisit",
        EXISTS (
          SELECT 1
          FROM "UltraFeedEvents" ufe
          WHERE ufe."userId" = $(userId)
            AND ufe."collectionName" = 'Comments'
            AND ufe."documentId" = c."_id"
            AND ufe."eventType" IN ('viewed', 'expanded')
        ) AS "seenInFeed",
        ${aiDigestActiveSeeLessExistsSubquery({ collectionName: "Comments", documentIdExpression: `c."_id"` })} AS "hasActiveSeeLess",
        COALESCE(
          p."userId" = $(userId) OR $(userId) = ANY(p."coauthorUserIds"),
          FALSE
        ) AS "onReaderAuthoredPost",
        COALESCE(parent."userId" = $(userId), FALSE) AS "replyToReaderComment"
      FROM "Comments" c
      LEFT JOIN "Posts" p ON p."_id" = c."postId"
      LEFT JOIN "Comments" parent ON parent."_id" = c."parentCommentId"
      LEFT JOIN LATERAL (
        SELECT rs."isRead", rs."lastUpdated"
        FROM "ReadStatuses" rs
        WHERE rs."userId" = $(userId)
          AND rs."postId" = c."postId"
        ORDER BY rs."lastUpdated" DESC
        LIMIT 1
      ) rs ON TRUE
      WHERE c."_id" = ANY($(commentIds)::text[])
    `, {
      userId,
      commentIds,
    });
  }
}

recordPerfMetrics(CommentsRepo);

export default CommentsRepo;
