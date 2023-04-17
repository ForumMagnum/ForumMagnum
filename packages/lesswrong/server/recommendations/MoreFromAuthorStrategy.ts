import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

class MoreFromAuthorStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]> {
    const {postId} = strategy;
    if (!postId) {
      throw new Error("No post specified in recommendation strategy");
    }
    return this.recommendDefaultWithPostFilter(
      currentUser,
      count,
      postId,
      `AND p."userId" = (SELECT "userId" FROM "Posts" WHERE "_id" = $(postId))`,
    );
  };
}

export default MoreFromAuthorStrategy;
