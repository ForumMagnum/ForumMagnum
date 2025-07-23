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
        WHERE "userId" = $[userId]
          AND "collectionName" = 'Posts'
          AND "eventType" IN ('served', 'viewed')
          AND "createdAt" > (NOW() - INTERVAL '1 day' * $[lookbackDays])
          AND (
            ("eventType" = 'served' AND event->'sources' ? $[scenarioId])
            OR "eventType" = 'viewed'
          )
        GROUP BY "documentId"
      ) s
      WHERE s.serve_count < 4 AND s.was_viewed = 0
      ORDER BY s.last_served
      LIMIT $[limit]
    `, {
      userId,
      scenarioId,
      lookbackDays,
      limit
    });

    return unviewedItems.map((row: any) => row.documentId);
  }
}

recordPerfMetrics(UltraFeedEventsRepo);

export default UltraFeedEventsRepo; 
