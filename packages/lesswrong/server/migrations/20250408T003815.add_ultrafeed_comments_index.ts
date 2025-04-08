import { updateCustomIndexes } from "./meta/utils";

/**
 * Add a partial index to optimize the universal filter clause in the UltraFeed comment query.
 * This supposedly improves performance by eliminating the full table scan when filtering
 * by deleted/retracted/authorIsUnreviewed/postId conditions.
 */
export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  void updateCustomIndexes(dbOutsideTransaction);
}
