import { Posts } from "../../lib/collections/posts";
import { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

class RecommendationService {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]> {
    return [
      (await Posts.findOne({_id: "iubYtRgrTC8Dx3zTo"}))!,
    ];
  }
}

export default RecommendationService;
