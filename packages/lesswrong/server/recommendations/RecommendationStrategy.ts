import { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

abstract class RecommendationStrategy {
  abstract recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]>;
}

export default RecommendationStrategy;
