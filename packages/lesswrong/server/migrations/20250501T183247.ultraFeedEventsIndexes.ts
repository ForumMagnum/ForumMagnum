/**
 * Migration to add optimized indexes to UltraFeedEvents table
 * 
 * Indexes are optimized for queries in:
 * - CommentsRepo.getCommentsForFeed
 * - SpotlightsRepo.getUltraFeedSpotlights
 * - PostsRepo.getLatestPostsForUltraFeed
 */

import { updateIndexes } from "./meta/utils";
import { UltraFeedEvents } from "../collections/ultraFeedEvents/collection";

export const up = async ({db}: MigrationContext) => {
  await updateIndexes(UltraFeedEvents);
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`
    DROP INDEX IF EXISTS "idx_ultraFeedEvents_userId_collectionName_eventType_createdAt_idx";
    DROP INDEX IF EXISTS "idx_ultraFeedEvents_userId_collectionName_documentId_idx";
  `);
}
