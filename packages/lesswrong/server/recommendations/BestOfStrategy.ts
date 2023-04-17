import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/collection";

class BestOfStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId}: StrategySpecification,
  ): Promise<DbPost[]> {
    return this.recommendDefaultWithPostFilter(
      currentUser,
      count,
      postId,
      `AND COALESCE((p."tagRelevance"->>$(communityId))::INTEGER, 0) < 1`,
      {communityId: EA_FORUM_COMMUNITY_TOPIC_ID},
      "baseScore",
    );
  };
}

export default BestOfStrategy;
