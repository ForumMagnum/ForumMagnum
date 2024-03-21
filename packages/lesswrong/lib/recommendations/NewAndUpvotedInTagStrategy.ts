import RecommendationStrategy, { ContextualRecommendationStrategy, RecommendationResult } from "./RecommendationStrategy";
import type { ContextualStrategySpecification, StrategySpecification } from "../collections/users/recommendationSettings";

/**
 * A recommendation strategy that returns more posts sharing a common tag.
 */
class NewAndUpvotedInTagStrategy extends ContextualRecommendationStrategy {
  constructor() {
    super();
  }

  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId, tagId}: ContextualStrategySpecification,
  ): Promise<RecommendationResult<true>> {
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
    );
    return {posts, settings: {postId, tagId}};
  };
}

export default NewAndUpvotedInTagStrategy;
