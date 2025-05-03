import { recordPerfMetrics } from "./perfMetricWrapper";
import AbstractRepo from "./AbstractRepo";
import { Bookmarks } from "../collections/bookmarks/collection";

interface UltraFeedBookmark {
  documentId: string;
  collectionName: string;
  postId?: string;
  directChildrenCount?: number;
}

class BookmarksRepo extends AbstractRepo<"Bookmarks"> {
  constructor() {
    super(Bookmarks);
  }

  /**
   * Gets bookmark items for the UltraFeed
   * Prioritizes more recent bookmarks with some randomness.
   */
  public async getBookmarksForFeed(
    context: ResolverContext,
    limit = 10
  ): Promise<UltraFeedBookmark[]> {
    const db = this.getRawDb();
    const userId = context.currentUser?._id;

    if (!userId) {
      return [];
    }

    const bookmarkRows = await db.manyOrNone<UltraFeedBookmark>(`
      -- BookmarksRepo.getUltraFeedBookmarks - Prioritize by recency with randomness
      SELECT
        b."documentId",
        b."collectionName",
        c."postId",
        c."directChildrenCount"
      FROM "Bookmarks" b
      LEFT JOIN "Comments" c ON b."documentId" = c."_id"
      WHERE b."userId" = $(userId)
        AND b."cancelled" IS FALSE
      ORDER BY
        -- Add a small factor based on creation time to the random sort
        -- Adjust the multiplier (e.g., 1e-11) to tune the recency bias
        RANDOM() + (EXTRACT(EPOCH FROM b."createdAt") * 1e-11)
      LIMIT $(limit)
    `, { limit, userId });

    if (!bookmarkRows || !bookmarkRows.length) {
      return [];
    }

    const bookmarkItems: UltraFeedBookmark[] = bookmarkRows.map(row => {
      return {
        documentId: row.documentId,
        collectionName: row.collectionName,
        postId: row.postId,
        directChildrenCount: row.directChildrenCount,
      };
    });

    return bookmarkItems;
  }
}

recordPerfMetrics(BookmarksRepo);

export { UltraFeedBookmark };
export default BookmarksRepo; 
