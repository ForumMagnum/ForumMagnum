import RecommendationStrategy from "./RecommendationStrategy";
import { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { Posts } from "../../lib/collections/posts";

export class MoreFromAuthorStrategy extends RecommendationStrategy {
  async recommend(
    _currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]> {
    if (!strategy.authorId) {
      throw new Error("No author specified in recommendation strategy");
    }
    return Posts.find({userId: strategy.authorId}, {limit: count}).fetch();
  };
}

export default MoreFromAuthorStrategy;
