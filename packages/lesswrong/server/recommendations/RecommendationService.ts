import { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
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
    return source.recommend(currentUser, count, strategy);
  }
}

export default RecommendationService;
