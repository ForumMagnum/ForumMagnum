import AbstractRepo from "./AbstractRepo";
import { FeedItemServings } from "../collections/feedItemServings/collection";
export default class FeedItemServingsRepo extends AbstractRepo<"FeedItemServings"> {
  constructor() {
    super(FeedItemServings); 
  }

  /**
   * Loads the user's feed history, returning at most one entry per unique feed item,
   * grouped by coalescing originalServingId and _id. Then returns only the most recent instance.
   * 
   * @param userId The user whose history we want to load
   * @param cutoff Optional date; if provided, only returns rows servedAt < cutoff
   * @param limit How many items to return
   */
  async loadDedupedFeedItemServingHistoryForUser(
    userId: string,
    cutoff: Date | null,
    limit: number
  ): Promise<DbFeedItemServing[]> {
    // Build the cutoff condition dynamically
    const cutoffClause = cutoff ? `AND s."servedAt" < $(cutoff)` : "";

    return this.getRawDb().any<DbFeedItemServing>(`
      -- FeedItemServingsRepo.loadDedupedFeedItemServingHistoryForUser
      WITH base AS (
        SELECT
          s.*,
          COALESCE(s."originalServingId", s."_id") AS "servingKey"
        FROM "FeedItemServings" s
        WHERE s."userId" = $(userId)
        ${cutoffClause}
      ),
      deduped AS (
        -- For each unique servingKey, select the most recent entry by servedAt
        SELECT DISTINCT ON ("servingKey") *
        FROM base
        -- servingKey must be first for DISTINCT ON, but we prioritize newest items
        ORDER BY "servingKey", "servedAt" DESC
      )
      -- Then sort the final results by most recent first
      SELECT * FROM deduped
      ORDER BY "servedAt" DESC, "position"
      LIMIT $(limit);
    `, {
      userId,
      cutoff,
      limit,
    });
  }
} 