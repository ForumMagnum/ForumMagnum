import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

class MoreFromTagStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]> {
    const {postId, tagId} = strategy;
    if (!postId) {
      throw new Error("No post specified in recommendation strategy");
    }
    if (!tagId) {
      throw new Error("No tag specified in recommendation strategy");
    }
    return this.recommendDefaultWithPostFilter(
      currentUser,
      count,
      postId,
      `AND ("p"."tagRelevance"->$(tagId))::INTEGER >= 1`,
      {tagId},
    );
  };
}

export default MoreFromTagStrategy;
