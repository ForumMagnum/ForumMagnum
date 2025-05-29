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
   * Fetches served comment events for a specific user and session,
   * groups them by itemIndex (representing a served thread),
   * and returns a Set of unique, stable hashes identifying those served threads.
   */
  async getRecentlyServedCommentThreadHashes(
    userId: string,
    sessionId: string,
    lookbackHours = 48
  ): Promise<Set<string>> {
    // Fetch relevant 'served' comment events for the session
    const servedEvents = await this.getRawDb().manyOrNone<{ documentId: string, itemIndex: number | null, commentIndex: number | null }>(`
      -- UltraFeedEventsRepo.getRecentlyServedCommentThreadHashes
      SELECT
          "documentId", -- The comment ID
          (event->>'itemIndex')::INTEGER AS "itemIndex", -- The index of the thread item in the feed batch
          (event->>'commentIndex')::INTEGER AS "commentIndex" -- Index within the thread
      FROM "UltraFeedEvents"
      WHERE
          "userId" = $1
          AND event->>'sessionId' = $2
          AND "collectionName" = 'Comments'
          AND "eventType" = 'served'
          AND "createdAt" > NOW() - INTERVAL $3
          AND event->>'itemIndex' IS NOT NULL
      ORDER BY
          "itemIndex" ASC,
          "commentIndex" ASC NULLS LAST
    `, [userId, sessionId, `${lookbackHours} hours`]);

    if (!servedEvents || servedEvents.length === 0) {
      return new Set<string>();
    }

    // Group events by the itemIndex they appeared at in the feed
    // Filter out any groups with null itemIndex just in case
    const groupedByItemIndex = groupBy(servedEvents.filter((e: { itemIndex: number | null }) => e.itemIndex !== null), 'itemIndex');

    const servedThreadHashes = new Set<string>();

    // Generate a hash for each group (each served thread)
    for (const itemIndex in groupedByItemIndex) {
      const commentsInGroup = groupedByItemIndex[itemIndex];
      // Sort by commentIndex again here just to be absolutely sure before hashing
      const sortedComments = commentsInGroup.sort((a, b) => (a.commentIndex ?? Infinity) - (b.commentIndex ?? Infinity));
      const commentIds = sortedComments.map(event => event.documentId);
      const threadHash = generateThreadHash(commentIds);
      servedThreadHashes.add(threadHash);
    }

    return servedThreadHashes;
  }
}

recordPerfMetrics(UltraFeedEventsRepo);

export default UltraFeedEventsRepo; 
