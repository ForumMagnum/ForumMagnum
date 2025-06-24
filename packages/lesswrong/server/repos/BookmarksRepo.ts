import { recordPerfMetrics } from "./perfMetricWrapper";
import AbstractRepo from "./AbstractRepo";
import { Bookmarks } from "../collections/bookmarks/collection";
import { randomId } from "@/lib/random";

interface UltraFeedBookmark {
  documentId: string;
  collectionName: string;
  postId: string | null;
  directChildrenCount: number | null;
}

class BookmarksRepo extends AbstractRepo<"Bookmarks"> {
  constructor(sqlClient?: SqlClient) {
    super(Bookmarks, sqlClient);
  }

  public async upsertBookmark(userId: string, documentId: string, collectionName: string): Promise<DbBookmark> {
    return this.one(`
      INSERT INTO "Bookmarks" ("_id", "userId", "documentId", "collectionName", "active", "createdAt", "lastUpdated")
      VALUES ($(bookmarkId), $(userId), $(documentId), $(collectionName), true, NOW(), NOW())
      ON CONFLICT ("userId", "documentId", "collectionName") DO UPDATE 
      SET 
        "active" = NOT "Bookmarks"."active",
        "lastUpdated" = NOW()
      WHERE "Bookmarks"."userId" = $(userId) 
        AND "Bookmarks"."documentId" = $(documentId) 
        AND "Bookmarks"."collectionName" = $(collectionName)
      RETURNING *
    `, {
      bookmarkId: randomId(),
      userId,
      documentId,
      collectionName,
    });
  }

  public async updateBookmarkCountForUser(userId: string): Promise<void> {
    await  this.none(`
      UPDATE "Users" u
      SET "bookmarksCount" = (
        SELECT count(*) FROM "Bookmarks" b
        WHERE b."userId" = $1
        AND b."active"
      )
      WHERE u._id = $1
    `, [userId]);
  }

  /**
   * Update the denormalized bookmarksCount field on all users. Intended for
   * migration (ie when the field is newly created). This took ~10s on the LW
   * dev DB.
   */
  public async updateBookmarkCountForAllUsers(): Promise<void> {
    await  this.none(`
      WITH counts AS (
        SELECT "userId", COUNT(*) AS cnt
        FROM   "Bookmarks"
        WHERE  "active"
        GROUP  BY "userId"
      )
      UPDATE "Users" u
      SET    "bookmarksCount" = c.cnt
      FROM   counts c
      WHERE  u._id = c."userId";
    `);
  }

  /**
   * Gets bookmark items for the UltraFeed
   * Prioritizes more recent bookmarks with some randomness.
   */
  public async getBookmarksForFeed(
    userId: string,
    limit = 10
  ): Promise<UltraFeedBookmark[]> {
    const bookmarkRows = await this.getRawDb().any<UltraFeedBookmark>(`
      -- BookmarksRepo.getUltraFeedBookmarks - Prioritize by recency with randomness
      SELECT
        b."documentId",
        b."collectionName",
        c."postId",
        c."directChildrenCount"
      FROM "Bookmarks" b
      LEFT JOIN "Comments" c ON b."documentId" = c."_id"
      WHERE b."userId" = $(userId)
        AND b."active" IS TRUE
      ORDER BY
        -- Add a small factor based on creation time to the random sort
        -- Adjust the multiplier (e.g., 1e-11) to tune the recency bias
        RANDOM() + (EXTRACT(EPOCH FROM b."createdAt") * 1e-11)
      LIMIT $(limit)
    `, { limit, userId });

    return bookmarkRows;
  }
}

recordPerfMetrics(BookmarksRepo);

export { UltraFeedBookmark };
export default BookmarksRepo; 
