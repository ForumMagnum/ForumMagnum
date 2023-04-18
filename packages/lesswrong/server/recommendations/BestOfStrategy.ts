import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

class BestOfStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId}: StrategySpecification,
  ): Promise<DbPost[]> {
    const {filter, args} = this.getCommunityFilter();
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
