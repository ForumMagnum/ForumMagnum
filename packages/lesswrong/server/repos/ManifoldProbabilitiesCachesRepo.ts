import { AnnualReviewMarketInfo } from "../../lib/annualReviewMarkets";
import ManifoldProbabilitiesCaches from "../../lib/collections/manifoldProbabilitiesCaches/collection";
import { randomId } from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

class ManifoldProbabilitiesCachesRepo extends AbstractRepo<"ManifoldProbabilitiesCaches"> {
  constructor() {
    super(ManifoldProbabilitiesCaches);
  }

  async upsertMarketInfoInCache (marketId: string, marketInfo: AnnualReviewMarketInfo): Promise<unknown> {
    return this.getRawDb().none(`
      INSERT INTO "ManifoldProbabilitiesCaches" (_id, "marketId", probability, "isResolved", year, "lastUpdated")
      VALUES ($(_id), $(marketId), $(marketInfo.probability), $(marketInfo.isResolved), $(marketInfo.year), NOW())
      ON CONFLICT ("marketId") DO UPDATE SET probability = $(marketInfo.probability), "isResolved" = $(marketInfo.isResolved), year = $(marketInfo.year), "lastUpdated" = NOW()`,
    {_id: randomId(), marketId: marketId, marketInfo});
  }
}

export default ManifoldProbabilitiesCachesRepo;

