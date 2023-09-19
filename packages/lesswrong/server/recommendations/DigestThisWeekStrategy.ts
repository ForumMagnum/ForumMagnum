import RecommendationStrategy, { RecommendationResult } from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";

/**
 * A recommendation strategy that returns the top posts from the forum digest
 * in the last week.
 */
class DigestThisWeekStrategy extends RecommendationStrategy {
  async recommend(
    _currentUser: DbUser|null,
    count: number,
    {postId}: StrategySpecification,
  ): Promise<RecommendationResult> {
    const db = getSqlClientOrThrow();
    const posts = await db.any(`
      SELECT p.*
      FROM "Posts" p
      JOIN "DigestPosts" dp ON p."_id" = dp."postId"
      JOIN "Digests" d ON d."_id" = dp."digestId"
      WHERE d."endDate" IS NULL
      ORDER BY p."baseScore" DESC
      LIMIT $1
    `, [count]);
    return {posts, settings: {postId}};
  };
}

export default DigestThisWeekStrategy;
