import FeatureStrategy from "./FeatureStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { RecommendationResult } from "./RecommendationStrategy";

/**
 * A recommendation strategy that returns the highest voted posts that the user
 * hasn't viewed. Note that, for performance reasons, the scores are not inflation
 * adjusted.
 */
class BestOfStrategy extends FeatureStrategy {
  constructor() {
    // Since this strategy is used infrequently (currently just in Wrapped?),
    // we want to allow more flexibility for posts to get re-recommended.
    super({maxRecommendationCount: 4})
  }
  
  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<RecommendationResult> {
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
    );
  };
}

export default BestOfStrategy;
