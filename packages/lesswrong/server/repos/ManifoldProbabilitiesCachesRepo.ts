import ManifoldProbabilitiesCaches from "../../lib/collections/manifoldProbabilitiesCaches/collection";
import { randomId } from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

class ManifoldProbabilitiesCachesRepo extends AbstractRepo<"ManifoldProbabilitiesCaches"> {
  constructor() {
    super(ManifoldProbabilitiesCaches);
  }

  async upsertMarketInfoInCache (marketId: string, probability: number, isResolved: boolean, year: number) : Promise<unknown> {
    return this.getRawDb().none(`
      INSERT INTO "ManifoldProbabilitiesCaches" (_id, "marketId", probability, "isResolved", year, "lastUpdated")
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT ("marketId") DO UPDATE SET probability = EXCLUDED.probability, "isResolved" = EXCLUDED."isResolved", year = EXCLUDED.year, "lastUpdated" = NOW()`,
    [randomId(), marketId, probability, isResolved, year]);
  }
}

export default ManifoldProbabilitiesCachesRepo;
