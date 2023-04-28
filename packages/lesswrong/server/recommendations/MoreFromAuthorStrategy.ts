import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

/**
 * A recommendation strategy that returns more posts by the same author.
 */
class MoreFromAuthorStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId}: StrategySpecification,
  ): Promise<DbPost[]> {
    return this.recommendDefaultWithPostFilter(
      currentUser,
      count,
      postId,
      `p."userId" = (SELECT "userId" FROM "Posts" WHERE "_id" = $(postId))`,
    );
  };
}

export default MoreFromAuthorStrategy;
