import SplashArtCoordinates from "../../lib/collections/splashArtCoordinates/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class SplashArtCoordinatesRepo extends AbstractRepo<"SplashArtCoordinates"> {
  constructor() {
    super(SplashArtCoordinates);
  }

  getActiveSplashArtCoordinates() {
    return this.any(`
      WITH cte AS (
        SELECT
          sac_with_rownumber.*,
          ROW_NUMBER() OVER (PARTITION BY sac_with_rownumber."reviewWinnerArtId" ORDER BY sac_with_rownumber."createdAt" DESC) as rn
        FROM "SplashArtCoordinates" AS sac_with_rownumber
      )
      SELECT *
      FROM CTE
      WHERE rn = 1
    `);
  }
}

recordPerfMetrics(SplashArtCoordinatesRepo);

export default SplashArtCoordinatesRepo;
