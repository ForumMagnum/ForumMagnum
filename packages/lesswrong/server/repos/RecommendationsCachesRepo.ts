import RecommendationsCaches from "../../lib/collections/recommendationsCaches/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class RecommendationsCachesRepo extends AbstractRepo<"RecommendationsCaches"> {
  constructor() {
    super(RecommendationsCaches);
  }

  getUserRecommendationsFromSource(userId: string, source: DbRecommendationsCache['source'], scenario: string) {
    return this.any(`
      DELETE
      FROM "RecommendationsCaches"
      WHERE "userId" = $1
      AND "source" = $2
      AND "scenario" = $3
      RETURNING *
    `, [userId, source, scenario]);
  }
}

recordPerfMetrics(RecommendationsCachesRepo);

export default RecommendationsCachesRepo;
