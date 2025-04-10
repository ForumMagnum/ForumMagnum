import RecommendationStrategy, { RecommendationResult } from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../sql/sqlClient";

/**
 * A recommendation strategy that returns more posts by the same author.
 */
class MoreFromAuthorStrategy extends RecommendationStrategy {
  async recommend(
    _currentUser: DbUser|null,
    count: number,
    {postId}: StrategySpecification,
  ): Promise<RecommendationResult> {
    const db = getSqlClientOrThrow();
    const postFilter = this.getDefaultPostFilter();
    const posts = await db.any(`
      SELECT p.*
      FROM "Posts" p
      JOIN "Posts" src ON src."_id" = $(postId)
      ${postFilter.join}
      WHERE
        ${postFilter.filter}
        p."_id" <> $(postId) AND
        (p."userId" = src."userId" OR EXISTS (
          SELECT 1
          FROM unnest(p."coauthorStatuses") AS status
          WHERE
            status->>'userId' = src."userId" AND
            (status->'confirmed' = TO_JSONB(TRUE) OR p."hasCoauthorPermission")
        ))
      ORDER BY p."score" DESC
      LIMIT $(count)
    `, {
      postId,
      count,
      ...postFilter.args,
    });
    return {posts, settings: {postId}};
  };
}

export default MoreFromAuthorStrategy;
