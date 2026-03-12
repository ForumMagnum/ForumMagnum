import { AnnualReviewMarketInfo } from "../../lib/collections/posts/annualReviewMarkets";
import ManifoldProbabilitiesCaches from "../../server/collections/manifoldProbabilitiesCaches/collection";
import { randomId } from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

class ManifoldProbabilitiesCachesRepo extends AbstractRepo<"ManifoldProbabilitiesCaches"> {
  constructor() {
    super(ManifoldProbabilitiesCaches);
  }

  /**
   * Attempts to "claim" a refresh slot for a given marketId without waiting on row locks.
   *
   * - If a cache row does not exist yet, returns { shouldRefresh: true } (caller will fetch+upsert).
   * - If a row exists and is older than minIntervalMs, we update lastUpdated (claim) and return { shouldRefresh: true }.
   * - If a row exists but is fresh, or is currently locked by another transaction, returns { shouldRefresh: false }.
   */
  async tryClaimRefreshSlot(
    marketId: string,
    minIntervalMs: number,
  ): Promise<{ shouldRefresh: boolean }> {
    const result = await this.getRawDb().one<{
      exists: boolean;
      updated: boolean;
    }>(`
      WITH existing AS (
        SELECT 1 AS exists
        FROM "ManifoldProbabilitiesCaches"
        WHERE "marketId" = $(marketId)
      ),
      candidate AS (
        SELECT "_id"
        FROM "ManifoldProbabilitiesCaches"
        WHERE "marketId" = $(marketId)
          AND "lastUpdated" < NOW() - $(minIntervalMs) * interval '1 millisecond'
        FOR UPDATE SKIP LOCKED
      ),
      updated AS (
        UPDATE "ManifoldProbabilitiesCaches" m
        SET "lastUpdated" = NOW()
        FROM candidate
        WHERE m."_id" = candidate."_id"
        RETURNING 1 AS updated
      )
      SELECT
        EXISTS(SELECT 1 FROM existing) AS "exists",
        EXISTS(SELECT 1 FROM updated) AS "updated"
    `, { marketId, minIntervalMs });

    // If there's no row, we can't lock/update it yet; allow the caller to fetch+upsert.
    if (!result.exists) {
      return { shouldRefresh: true };
    }

    // If we successfully bumped lastUpdated, we "own" the refresh.
    return { shouldRefresh: result.updated };
  }

  async upsertMarketInfoInCache (marketId: string, marketInfo: AnnualReviewMarketInfo): Promise<unknown> {
    return this.getRawDb().none(`
      INSERT INTO "ManifoldProbabilitiesCaches" (_id, "marketId", probability, "isResolved", year, "lastUpdated", url)
      VALUES ($(_id), $(marketId), $(marketInfo.probability), $(marketInfo.isResolved), $(marketInfo.year), NOW(), $(marketInfo.url))
      ON CONFLICT ("marketId") DO UPDATE SET probability = $(marketInfo.probability), "isResolved" = $(marketInfo.isResolved), year = $(marketInfo.year), "lastUpdated" = NOW(), url = $(marketInfo.url)`,
    {_id: randomId(), marketId: marketId, marketInfo});
  }
}

export default ManifoldProbabilitiesCachesRepo;

