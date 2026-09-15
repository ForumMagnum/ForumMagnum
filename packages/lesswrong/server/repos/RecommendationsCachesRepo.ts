import RecommendationsCaches from "../../server/collections/recommendationsCaches/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import InsertQuery from "../sql/InsertQuery";

class RecommendationsCachesRepo extends AbstractRepo<"RecommendationsCaches"> {
  constructor() {
    super(RecommendationsCaches);
  }

  async insertRecommendations(recommendations: DbRecommendationsCache[]): Promise<void> {
    if (!recommendations.length) return;

    const { sql, args } = new InsertQuery(this.collection.getTable(), recommendations).compile();
    // Concurrent requests can consume the cache before either background refill
    // finishes. Keep the first copy and its attribution, while inserting new posts.
    await this.none(`${sql}
      ON CONFLICT ("userId", "postId", "source", "scenario") DO NOTHING
    `, args);
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
