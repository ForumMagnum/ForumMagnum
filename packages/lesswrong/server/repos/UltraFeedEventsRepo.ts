import AbstractRepo from './AbstractRepo';
import UltraFeedEvents from '../collections/ultraFeedEvents/collection';
import groupBy from 'lodash/groupBy';
import { recordPerfMetrics } from './perfMetricWrapper';
import { generateThreadHash } from '@/server/ultraFeed/ultraFeedThreadHelpers';

class UltraFeedEventsRepo extends AbstractRepo<'UltraFeedEvents'> {
  constructor() {
    super(UltraFeedEvents);
  }

  /**
   * Fetches served comment events for a specific user,
   * groups them by itemIndex (representing a served thread),
   * and returns a Set of unique, stable hashes identifying those served threads.
   */
  async getRecentlyServedCommentThreadHashes(
    userId: string,
    lookbackHours = 48
  ): Promise<Set<string>> {
    // Fetch relevant 'served' comment events across all sessions
    const servedEvents = await this.getRawDb().manyOrNone<{ documentId: string, itemIndex: number | null, commentIndex: number | null, sessionId: string }>(`
      -- UltraFeedEventsRepo.getRecentlyServedCommentThreadHashes
      SELECT
          "documentId", -- The comment ID
          (event->>'itemIndex')::INTEGER AS "itemIndex", -- The index of the thread item in the feed batch
          (event->>'commentIndex')::INTEGER AS "commentIndex", -- Index within the thread
          event->>'sessionId' AS "sessionId" -- Include sessionId for grouping
      FROM "UltraFeedEvents"
      WHERE
          "userId" = $1
          AND "collectionName" = 'Comments'
          AND "eventType" = 'served'
          AND "createdAt" > NOW() - INTERVAL $2
          AND event->>'itemIndex' IS NOT NULL
      ORDER BY
          "createdAt" DESC,
          "itemIndex" ASC,
          "commentIndex" ASC NULLS LAST
    `, [userId, `${lookbackHours} hours`]);

    if (!servedEvents || servedEvents.length === 0) {
      return new Set<string>();
    }

    // Group events by sessionId + itemIndex to properly reconstruct threads
    const threadGroups = servedEvents.reduce((groups, event) => {
      const key = `${event.sessionId}-${event.itemIndex}`;
      return {
        ...groups,
        [key]: [...(groups[key] || []), event]
      };
    }, {} as Record<string, typeof servedEvents>);

    // Generate a hash for each thread
    const threadHashes = Object.values(threadGroups).map(commentsInGroup => {
      // Sort by commentIndex to ensure consistent ordering
      const sortedComments = [...commentsInGroup].sort((a, b) => 
        (a.commentIndex ?? Infinity) - (b.commentIndex ?? Infinity)
      );
      const commentIds = sortedComments.map(event => event.documentId);
      return generateThreadHash(commentIds);
    });

    return new Set(threadHashes);
  }
}

recordPerfMetrics(UltraFeedEventsRepo);

export default UltraFeedEventsRepo; 
