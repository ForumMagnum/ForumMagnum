import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

/**
 * A recommendation strategy that returns the highest voted posts that the user
 * hasn't viewed. Note that, for performance reasons, the scores are not inflation
 * adjusted.
 */
class BestOfStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId}: StrategySpecification,
  ): Promise<DbPost[]> {
    const {filter, args} = this.getTagFilter();
    return this.recommendDefaultWithPostFilter(
      currentUser,
      count,
      postId,
      filter,
      args,
      "baseScore",
    );
  };
}

export default BestOfStrategy;
