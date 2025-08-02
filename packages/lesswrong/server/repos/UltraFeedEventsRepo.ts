import AbstractRepo from './AbstractRepo';
import UltraFeedEvents from '../collections/ultraFeedEvents/collection';
import { recordPerfMetrics } from './perfMetricWrapper';
import { FeedItemSourceType } from '@/components/ultraFeed/ultraFeedTypes';

export interface UnviewedItem {
  documentId: string;
  collectionName: "Posts" | "Spotlights";
  sources: FeedItemSourceType[];
  servedAt: Date;
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
    const unviewedItems = await this.manyOrNone(`
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

    return unviewedItems.map((row: any) => row.documentId);
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

    const viewedPosts = await this.manyOrNone(`
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

    return new Set(viewedPosts.map((row: any) => row.postId));
  }
}

recordPerfMetrics(UltraFeedEventsRepo);

export default UltraFeedEventsRepo; 
