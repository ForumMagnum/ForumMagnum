import AbstractRepo from "./AbstractRepo";
import PostRecommendations from "../../lib/collections/postRecommendations/collection";
import type { RecommendationStrategyName } from "../../lib/collections/users/recommendationSettings";
import { randomId } from "../../lib/random";

export default class PostRecommendationsRepo extends AbstractRepo<DbPostRecommendation> {
  constructor() {
    super(PostRecommendations);
  }

  async recordRecommendations(
    currentUser: DbUser,
    strategyName: RecommendationStrategyName,
    posts: DbPost[],
  ): Promise<void> {
    await Promise.all(posts.map(({_id}) => this.none(`
      INSERT INTO "PostRecommendations" (
        "_id",
        "userId",
        "postId",
        "strategyName",
        "recommendationCount",
        "lastRecommendedAt",
        "createdAt"
      ) VALUES (
        $1, $2, $3, $4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) ON CONFLICT ("userId", "postId") DO UPDATE SET
        "strategyName" = $4,
        "lastRecommendedAt" = CURRENT_TIMESTAMP
    `, [randomId(), currentUser._id, _id, strategyName])));
  }

  async markRecommendationAsObserved(userId: string, postId: string): Promise<void> {
    await this.none(`
      UPDATE "PostRecommendations"
      SET "recommendationCount" = "recommendationCount" + 1
      WHERE "userId" = $1 AND "postId" = $2
    `, [userId, postId]);
  }

  async markRecommendationAsClicked(userId: string, postId: string): Promise<void> {
    await this.none(`
      UPDATE "PostRecommendations"
      SET "clickedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = $1 AND "postId" = $2
    `, [userId, postId]);
  }
}
