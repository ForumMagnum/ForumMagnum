import { AnnualReviewMarketInfo } from "../../lib/collections/posts/annualReviewMarkets";
import ManifoldProbabilitiesCaches from "../../server/collections/manifoldProbabilitiesCaches/collection";
import { randomId } from "../../lib/random";
import AbstractRepo from "./AbstractRepo";
import { ITask } from 'pg-promise';

class ManifoldProbabilitiesCachesRepo extends AbstractRepo<"ManifoldProbabilitiesCaches"> {
  constructor() {
    super(ManifoldProbabilitiesCaches);
  }

  async updateMarketInfoCacheTimestamp (task: ITask<any>, marketId: string): Promise<Date|null> {
    const result = await task.oneOrNone(`
      UPDATE "ManifoldProbabilitiesCaches"
      SET "lastUpdated" = NOW()
      WHERE "marketId"=$(marketId)
      RETURNING "lastUpdated"
    `, {marketId});
    return result?.lastUpdated ?? null;
  }

  async upsertMarketInfoInCache (task: ITask<any>, marketId: string, marketInfo: AnnualReviewMarketInfo): Promise<unknown> {
    return task.none(`
      INSERT INTO "ManifoldProbabilitiesCaches" (_id, "marketId", probability, "isResolved", year, "lastUpdated", url)
      VALUES ($(_id), $(marketId), $(marketInfo.probability), $(marketInfo.isResolved), $(marketInfo.year), NOW(), $(marketInfo.url))
      ON CONFLICT ("marketId") DO UPDATE SET probability = $(marketInfo.probability), "isResolved" = $(marketInfo.isResolved), year = $(marketInfo.year), "lastUpdated" = NOW(), url = $(marketInfo.url)`,
    {_id: randomId(), marketId: marketId, marketInfo});
  }
}

export default ManifoldProbabilitiesCachesRepo;

