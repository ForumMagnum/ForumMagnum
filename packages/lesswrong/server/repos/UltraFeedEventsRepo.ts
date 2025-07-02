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
      SELECT DISTINCT ON (uf_served."documentId")
        uf_served."documentId"
      FROM "UltraFeedEvents" uf_served
      LEFT JOIN "UltraFeedEvents" uf_viewed
        ON uf_served."documentId" = uf_viewed."documentId"
        AND uf_served."userId" = uf_viewed."userId"
        AND uf_viewed."eventType" = 'viewed'
      WHERE uf_served."eventType" = 'served'
        AND uf_served."userId" = $[userId]
        AND uf_served."createdAt" > (NOW() - INTERVAL '1 day' * $[lookbackDays])
        AND uf_served."collectionName" = 'Posts'
        AND uf_served.event->'sources' ? $[scenarioId]
        AND uf_viewed._id IS NULL
      ORDER BY uf_served."documentId", uf_served."createdAt" DESC
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
