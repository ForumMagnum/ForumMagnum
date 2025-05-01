/**
 * Migration to add optimized indexes to UltraFeedEvents table
 * 
 * Indexes are optimized for queries in:
 * - CommentsRepo.getCommentsForFeed
 * - SpotlightsRepo.getUltraFeedSpotlights
 * - PostsRepo.getLatestPostsForUltraFeed
 */

export const up = async ({db}: MigrationContext) => {
  // Primary index for most queries - userId first as recommended
  await db.none(`
    CREATE INDEX IF NOT EXISTS "ultraFeedEvents_userId_collectionName_eventType_createdAt_idx" 
    ON "UltraFeedEvents" ("userId", "collectionName", "eventType", "createdAt");
  `);

  // Secondary index for document lookups - also starts with userId
  await db.none(`
    CREATE INDEX IF NOT EXISTS "ultraFeedEvents_userId_collectionName_documentId_idx" 
    ON "UltraFeedEvents" ("userId", "collectionName", "documentId");
  `);
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`
    DROP INDEX IF EXISTS "ultraFeedEvents_userId_collectionName_eventType_createdAt_idx";
    DROP INDEX IF EXISTS "ultraFeedEvents_userId_collectionName_documentId_idx";
  `);
}
