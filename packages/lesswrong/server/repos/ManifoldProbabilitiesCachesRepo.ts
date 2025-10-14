import { AnnualReviewMarketInfo } from "../../lib/collections/posts/annualReviewMarkets";
import ManifoldProbabilitiesCaches from "../../server/collections/manifoldProbabilitiesCaches/collection";
import { randomId } from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

class ManifoldProbabilitiesCachesRepo extends AbstractRepo<"ManifoldProbabilitiesCaches"> {
  constructor() {
    super(ManifoldProbabilitiesCaches);
  }

  async updateMarketInfoCacheTimestamp (marketId: string): Promise<Date|null> {
    const result = await this.getRawDb().oneOrNone(`
      UPDATE "ManifoldProbabilitiesCaches"
      SET "lastUpdated" = NOW()
      WHERE "marketId"=$(marketId)
      RETURNING "lastUpdated"
    `, {marketId});
    return result?.lastUpdated ?? null;
  }

  async upsertMarketInfoInCache (marketId: string, marketInfo: AnnualReviewMarketInfo): Promise<unknown> {
    return this.getRawDb().none(`
      INSERT INTO "ManifoldProbabilitiesCaches" (_id, "marketId", probability, "isResolved", year, "lastUpdated", url, mechanism, pool, p)
      VALUES ($(_id), $(marketId), $(marketInfo.probability), $(marketInfo.isResolved), $(marketInfo.year), NOW(), $(marketInfo.url), $(marketInfo.mechanism), $(marketInfo.pool), $(marketInfo.p))
      ON CONFLICT ("marketId") DO UPDATE SET probability = $(marketInfo.probability), "isResolved" = $(marketInfo.isResolved), year = $(marketInfo.year), "lastUpdated" = NOW(), url = $(marketInfo.url), mechanism = $(marketInfo.mechanism), pool = $(marketInfo.pool), p = $(marketInfo.p)`,
    {_id: randomId(), marketId: marketId, marketInfo});
  }
}

export default ManifoldProbabilitiesCachesRepo;

