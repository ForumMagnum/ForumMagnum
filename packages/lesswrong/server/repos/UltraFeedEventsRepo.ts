import AbstractRepo from './AbstractRepo';
import UltraFeedEvents from '../collections/ultraFeedEvents/collection';
import { recordPerfMetrics } from './perfMetricWrapper';
import { FeedItemSourceType, FeedItemRenderType, FeedItemDisplayStatus } from '@/components/ultraFeed/ultraFeedTypes';

export interface UnviewedItem {
  documentId: string;
  collectionName: "Posts" | "Spotlights";
  sources: FeedItemSourceType[];
  servedAt: Date;
}

export interface ServedHistoryComment {
  commentId: string;
  displayStatus: FeedItemDisplayStatus | null;
  commentIndex: number | null;
  isRead: boolean | null;
}

export interface ServedHistoryItem {
  type: FeedItemRenderType;
  servedAt: Date;
  documentId: string;
  sources: FeedItemSourceType[] | null;
  isRead?: boolean | null;  // Has the post/spotlight ever been read
  itemWasViewed?: boolean | null;  // Was this specific serve event viewed
  itemIndex?: number;
  sessionId?: string;
  comments?: ServedHistoryComment[] | null;
  postId?: string | null;
  isOnReadPost?: boolean | null;
}

interface ServedHistoryCommentRaw {
  commentId: string;
  displayStatus: string | null;
  commentIndex: number | null;
  isRead: boolean;
}

interface ServedHistoryItemRaw {
  type: FeedItemRenderType;
  served_at: Date;
  document_id: string;
  sources: FeedItemSourceType[] | null;
  is_read: boolean | null;
  item_was_viewed: boolean | null;
  session_id: string | null;
  item_index: number | null;
  comments: ServedHistoryCommentRaw[] | null;
  post_id: string | null;
  is_on_read_post: boolean | null;
}

class UltraFeedEventsRepo extends AbstractRepo<'UltraFeedEvents'> {
  constructor() {
    super(UltraFeedEvents);
  }

  /**
   * Fetches unviewed Recombee post IDs for feed optimization.
   * This is a lighter query that only returns document IDs.
   */
  async getUnviewedRecombeePostIds(
    userId: string,
    scenarioId: string,
    lookbackDays: number,
    limit: number
  ): Promise<string[]> {
    const unviewedItems = await this.getRawDb().manyOrNone<{ documentId: string }>(`
      -- UltraFeedEventsRepo.getUnviewedRecombeePostIds
      SELECT
        s."documentId"
      FROM (
        SELECT
          "documentId",
          SUM(CASE WHEN "eventType" = 'served' THEN 1 ELSE 0 END) as serve_count,
          MAX(CASE WHEN "eventType" = 'served' THEN "createdAt" END) as last_served,
          MAX(CASE WHEN "eventType" = 'viewed' THEN 1 ELSE 0 END) as was_viewed
        FROM "UltraFeedEvents"
        WHERE "userId" = $(userId)
          AND "collectionName" = 'Posts'
          AND "eventType" IN ('served', 'viewed')
          AND "createdAt" > (NOW() - INTERVAL '1 day' * $(lookbackDays))
          AND (
            ("eventType" = 'served' AND event->'sources' ? $(scenarioId))
            OR "eventType" = 'viewed'
          )
        GROUP BY "documentId"
      ) s
      WHERE s.serve_count < 3 AND s.was_viewed = 0
      ORDER BY s.last_served
      LIMIT $(limit)
    `, {
      userId,
      scenarioId,
      lookbackDays,
      limit
    });

    return unviewedItems.map((row) => row.documentId);
  }

  /**
   * Checks whether posts have been viewed by a user.
   * Returns a Set of post IDs that have been viewed (either in UltraFeedEvents or ReadStatuses).
   */
  async getViewedPostIds(
    userId: string,
    postIds: string[],
  ): Promise<Set<string>> {
    if (postIds.length === 0) {
      return new Set();
    }

    const viewedPosts = await this.getRawDb().manyOrNone<{ postId: string }>(`
      -- UltraFeedEventsRepo.getViewedPostIds
      SELECT DISTINCT "postId"
      FROM (
        -- Check UltraFeedEvents for viewed events
        SELECT "documentId" AS "postId"
        FROM "UltraFeedEvents"
        WHERE 
          "userId" = $(userId)
          AND "collectionName" = 'Posts'
          AND "eventType" = 'viewed'
          AND "documentId" = ANY($(postIds)::text[])
        
        UNION
        
        -- Check ReadStatuses for read posts
        SELECT "postId"
        FROM "ReadStatuses"
        WHERE 
          "userId" = $(userId)
          AND "isRead" IS TRUE
          AND "postId" = ANY($(postIds)::text[])
      ) AS viewed
    `, {
      userId,
      postIds,
    });

    return new Set(viewedPosts.map((row) => row.postId));
  }

  /**
   * Gets comment IDs that have been served in a specific session.
   */
  async getServedCommentIdsForSession(
    userId: string,
    sessionId: string
  ): Promise<Set<string>> {
    const servedComments = await this.getRawDb().manyOrNone<{ documentId: string }>(`
      -- UltraFeedEventsRepo.getServedCommentIdsForSession
      SELECT DISTINCT "documentId"
      FROM "UltraFeedEvents"
      WHERE 
        "userId" = $(userId)
        AND "collectionName" = 'Comments'
        AND "eventType" = 'served'
        AND event->>'sessionId' = $(sessionId)
    `, {
      userId,
      sessionId
    });

    return new Set(servedComments.map((row) => row.documentId));
  }

  /**
   * Fetch a chronological feed of items that were served to the user, grouped as:
   * - Posts: grouped by post ID (latest serve time)
   * - Spotlights: grouped by spotlight ID (latest serve time)
   * - Comment Threads: grouped by (sessionId, itemIndex) to reconstruct a single feed card
   *
   * Results are ordered by last served time descending and paginated by cutoff/offset/limit.
   */
  async getServedHistoryItems({
    userId,
    cutoff,
    offset = 0,
    limit = 20,
  }: {
    userId: string,
    cutoff?: Date | null,
    offset?: number,
    limit?: number,
  }): Promise<ServedHistoryItem[]> {
    const rows = await this.getRawDb().manyOrNone<ServedHistoryItemRaw>(`
      -- UltraFeedEventsRepo.getServedHistoryItems
      WITH base_served AS (
        SELECT
          ue._id,
          ue."documentId",
          ue."collectionName",
          ue."createdAt",
          ue.event,
          ue."userId"
        FROM "UltraFeedEvents" ue
        WHERE ue."userId" = $(userId)
          AND ue."eventType" = 'served'
          AND ($(cutoff) IS NULL OR ue."createdAt" < $(cutoff))
      ),
      prepared_comments AS (
        -- Prepare individual comments with their read status and topLevelCommentId
        SELECT
          bs."documentId" AS comment_id,
          bs."createdAt" AS served_at,
          bs.event->>'sessionId' AS session_id,
          (bs.event->>'itemIndex')::int AS item_index,
          NULLIF(bs.event->>'commentIndex','')::int AS comment_index,
          COALESCE(bs.event->>'displayStatus', NULL) AS display_status,
          COALESCE(bs.event->'sources', '[]'::jsonb) AS sources,
          COALESCE(c."topLevelCommentId", c._id) AS top_level_comment_id,
          c."postId" AS post_id,
          -- Check if comment has ever been read (for UI display)
          CASE 
            WHEN rs."isRead" IS TRUE AND c."postedAt" < rs."lastUpdated" THEN TRUE
            WHEN EXISTS (
              SELECT 1 FROM "UltraFeedEvents" 
              WHERE "userId" = $(userId) 
                AND "documentId" = bs."documentId"
                AND "eventType" = 'viewed'
            ) THEN TRUE
            ELSE FALSE
          END AS is_read
        FROM base_served bs
        INNER JOIN "Comments" c ON bs."documentId" = c._id
        LEFT JOIN "ReadStatuses" rs ON c."postId" = rs."postId" AND rs."userId" = $(userId)
        WHERE bs."collectionName" = 'Comments'
      ),
      comment_groups AS (
        -- Aggregate prepared comments by session and item
        SELECT
          cg.session_id,
          cg.item_index,
          cg.top_level_comment_id,
          cg.last_served_at,
          cg.sources,
          cg.post_id,
          -- Check if the post has been read
          CASE 
            WHEN pve."documentId" IS NOT NULL OR rs."isRead" = TRUE THEN TRUE
            ELSE FALSE
          END AS is_on_read_post,
          cg.comments
        FROM (
          SELECT
            session_id,
            item_index,
            top_level_comment_id,
            MAX(served_at) AS last_served_at,
            (ARRAY_AGG(sources ORDER BY comment_index))[1] AS sources,
            MAX(post_id) AS post_id,
            JSONB_AGG(
              jsonb_build_object(
                'commentId', comment_id,
                'displayStatus', display_status,
                'commentIndex', comment_index,
                'isRead', is_read
              )
              ORDER BY comment_index
            ) AS comments
          FROM prepared_comments
          GROUP BY session_id, item_index, top_level_comment_id
        ) cg
        LEFT JOIN (
          SELECT DISTINCT "documentId"
          FROM "UltraFeedEvents"
          WHERE "userId" = $(userId)
            AND "collectionName" = 'Posts'
            AND "eventType" = 'viewed'
        ) pve ON pve."documentId" = cg.post_id
        LEFT JOIN "ReadStatuses" rs ON rs."postId" = cg.post_id 
          AND rs."userId" = $(userId)
          AND rs."isRead" = TRUE
      ),
      unified_results AS (
        -- Comment threads
        SELECT 
          'feedCommentThread'::text AS type,
          last_served_at AS served_at,
          top_level_comment_id::text AS document_id,
          sources,
          NULL::boolean AS is_read,  -- Read status is per-comment for threads
          -- Check if any comment in this thread was viewed
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(comments) AS c
            WHERE (c->>'isRead')::boolean = TRUE
          ) AS item_was_viewed,
          session_id,
          item_index,
          comments,
          post_id,
          is_on_read_post
        FROM comment_groups
        
        UNION ALL
        
        -- Posts
        SELECT 
          'feedPost'::text AS type,
          "createdAt" AS served_at,
          "documentId" AS document_id,
          COALESCE(event->'sources', '[]'::jsonb) AS sources,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM "UltraFeedEvents" 
              WHERE "userId" = $(userId) 
                AND "documentId" = base_served."documentId"
                AND "eventType" = 'viewed'
            ) OR EXISTS (
              SELECT 1 FROM "ReadStatuses"
              WHERE "userId" = $(userId)
                AND "postId" = base_served."documentId"
                AND "isRead" = TRUE
            ) THEN TRUE
            ELSE FALSE
          END AS is_read,  -- Has this post ever been read
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM "UltraFeedEvents" 
              WHERE "userId" = $(userId) 
                AND "feedItemId" = base_served._id
                AND "eventType" = 'viewed'
            ) THEN TRUE
            ELSE FALSE
          END AS item_was_viewed,  -- Was this specific serve event viewed
          event->>'sessionId' AS session_id,
          (event->>'itemIndex')::int AS item_index,
          NULL::jsonb AS comments,
          NULL::text AS post_id,
          NULL::boolean AS is_on_read_post
        FROM base_served
        WHERE "collectionName" = 'Posts'
        
        UNION ALL
        
        -- Spotlights
        SELECT 
          'feedSpotlight'::text AS type,
          "createdAt" AS served_at,
          "documentId" AS document_id,
          COALESCE(event->'sources', '["spotlights"]'::jsonb) AS sources,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM "UltraFeedEvents" 
              WHERE "userId" = $(userId) 
                AND "documentId" = base_served."documentId"
                AND "eventType" = 'viewed'
            ) THEN TRUE
            ELSE FALSE
          END AS is_read,  -- Has this spotlight ever been read
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM "UltraFeedEvents" 
              WHERE "userId" = $(userId) 
                AND "feedItemId" = base_served._id
                AND "eventType" = 'viewed'
            ) THEN TRUE
            ELSE FALSE
          END AS item_was_viewed,  -- Was this specific serve event viewed
          event->>'sessionId' AS session_id,
          (event->>'itemIndex')::int AS item_index,
          NULL::jsonb AS comments,
          NULL::text AS post_id,
          NULL::boolean AS is_on_read_post
        FROM base_served
        WHERE "collectionName" = 'Spotlights'
      )
      SELECT *
      FROM unified_results
      ORDER BY served_at DESC, COALESCE(item_index, 0) DESC
      OFFSET $(offset)
      LIMIT $(limit)
    `, {
      userId,
      cutoff: cutoff ?? null,
      offset,
      limit,
    });

    return rows.map(r => {
      const comments = (r.comments && r.comments.length > 0)
        ? r.comments.map((c): ServedHistoryComment => ({
          commentId: c.commentId,
          displayStatus: (c.displayStatus ?? null) as FeedItemDisplayStatus | null,
          commentIndex: c.commentIndex ?? null,
          isRead: c.isRead ?? null,
        }))
        : null;

      return {
        type: r.type,
        servedAt: r.served_at,
        documentId: r.document_id,
        sources: r.sources,
        isRead: (r.type === 'feedPost' || r.type === 'feedSpotlight') ? r.is_read : undefined,
        itemWasViewed: r.item_was_viewed ?? undefined,
        sessionId: r.session_id ?? undefined,
        itemIndex: r.item_index ?? undefined,
        comments,
        postId: r.type === 'feedCommentThread' ? r.post_id : undefined,
        isOnReadPost: r.type === 'feedCommentThread' ? r.is_on_read_post : undefined,
      };
    });
  }
}

recordPerfMetrics(UltraFeedEventsRepo);

export default UltraFeedEventsRepo; 
