import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";

class MoreFromTagStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId}: StrategySpecification,
  ): Promise<DbPost[]> {
    const tag = await this.chooseTagForPost(postId);
    if (!tag) {
      throw new Error("Couldn't choose a relevant tag for post " + postId);
    }
    return this.recommendDefaultWithPostFilter(
      currentUser,
      count,
      postId,
      `("p"."tagRelevance"->$(tagId))::INTEGER >= 1`,
      {tagId: tag._id},
    );
  };

  private async chooseTagForPost(postId: string): Promise<{_id: string} | null> {
    const db = getSqlClientOrThrow();
    return db.oneOrNone(`
      SELECT t."_id" FROM "Tags" t
      JOIN "Posts" p ON p."_id" = $1
      WHERE
        t."_id" IN (SELECT JSONB_OBJECT_KEYS(p."tagRelevance")) AND
        t."postCount" >= 10
      ORDER BY p."tagRelevance"->t."_id" DESC, t."postCount" ASC
      LIMIT 1
    `, [postId]);
  }
}

export default MoreFromTagStrategy;
