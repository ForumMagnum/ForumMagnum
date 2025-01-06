import FeatureStrategy from "./FeatureStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { RecommendationResult } from "./RecommendationStrategy";

/**
 * Strategy for choosing recommended "posts you may have missed" for EA Forum
 * wrapped
 */
class WrappedStrategy extends FeatureStrategy {
  constructor() {
    super({
      maxRecommendationCount: 5,
    });
  }

  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<RecommendationResult> {
    const year = strategy.year;
    if (!year) {
      throw new Error("Wrapped recommendation strategy requires a year");
    }
    return super.recommend(
      currentUser,
      count,
      {
        ...strategy,
        features: [
          {feature: "karma", weight: 1},
          {feature: "curated", weight: 0.05},
        ],
      },
      {
        publishedAfter: new Date(year, 0),
        publishedBefore: new Date(year + 1, 0),
      },
    );
  };
}

export default WrappedStrategy;
