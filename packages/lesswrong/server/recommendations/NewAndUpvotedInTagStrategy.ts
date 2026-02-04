import RecommendationStrategy, { RecommendationResult } from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

/**
 * A recommendation strategy that returns more posts sharing a common tag.
 */
class NewAndUpvotedInTagStrategy extends RecommendationStrategy {
  constructor() {
    super();
  }

  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<RecommendationResult> {
    const {postId, tagId} = strategy;
    if (!tagId) {
      throw new Error("No tag id provided");
    }
    const posts = await this.recommendDefaultWithPostFilter(
      currentUser,
      count,
      postId,
      `
        (p."tagRelevance"->$(tagId))::INTEGER >= 1 AND
        (NOW() - p."createdAt") < '3 months'
      `,
      {tagId},
      "score",
      strategy,
    );
    return {posts, settings: {postId, tagId, af: strategy.af}};
  };
}

export default NewAndUpvotedInTagStrategy;
