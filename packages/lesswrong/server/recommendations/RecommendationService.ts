import { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { randomId } from "../../lib/random";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { MoreFromAuthorStrategy } from "./MoreFromAuthorStrategy";
import RecommendationStrategy from "./RecommendationStrategy";

type ConstructableStrategy = {
  new (): RecommendationStrategy,
}

class RecommendationService {
  private strategies: Record<string, ConstructableStrategy> = {
    moreFromAuthor: MoreFromAuthorStrategy,
  };

  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]> {
    const Provider = this.strategies[strategy.name];
    if (!Provider) {
      throw new Error("Invalid recommendation strategy name: " + strategy.name);
    }
    const source = new Provider();
    const posts = await source.recommend(currentUser, count, strategy);
    if (currentUser) {
      void this.recordRecommendations(currentUser, strategy, posts);
    }
    return posts;
  }

  protected async recordRecommendations(
    currentUser: DbUser,
    strategy: StrategySpecification,
    posts: DbPost[],
  ): Promise<void> {
    const db = getSqlClientOrThrow();
    await Promise.all(posts.map(({_id}) => db.none(`
      INSERT INTO "PostRecommendations" (
        "_id",
        "userId",
        "postId",
        "strategyName",
        "recommendationCount",
        "lastRecommendedAt",
        "createdAt"
      ) VALUES (
        $1, $2, $3, $4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) ON CONFLICT ("userId", "postId") DO UPDATE SET
        "strategyName" = $4,
        "recommendationCount" = "PostRecommendations"."recommendationCount" + 1,
        "lastRecommendedAt" = CURRENT_TIMESTAMP
    `, [randomId(), currentUser._id, _id, strategy.name])));
  }
}

export default RecommendationService;
