import { postStatuses } from "../../lib/collections/posts/constants";
import { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";

abstract class RecommendationStrategy {
  private readonly maxRecommendationCount = 3;

  abstract recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]>;

  protected recommendDefaultWithPostFilter(
    currentUser: DbUser|null,
    count: number,
    postId: string,
    filter: string,
    args: Record<string, unknown> = {},
  ): Promise<DbPost[]> {
    const db = getSqlClientOrThrow();
    const userJoin = currentUser
      ? `
        LEFT JOIN "ReadStatuses" rs
          ON rs."userId" = $(userId)
          AND rs."postId" = p."_id"
        LEFT JOIN "PostRecommendations" pr
          ON pr."userId" = $(userId)
          AND pr."postId" = p."_id"
      `
      : "";
    const userFilter = currentUser
      ? `
        rs."isRead" IS NOT TRUE AND
        COALESCE(pr."recommendationCount", 0) < $(maxRecommendationCount) AND
      `
      : "";
    return db.any(`
      SELECT p.*
      FROM "Posts" p
      ${userJoin}
      WHERE
        ${userFilter}
        p."_id" <> $(postId) AND
        p."status" = $(postStatus) AND
        p."draft" IS NOT TRUE AND
        p."deletedDraft" IS NOT TRUE AND
        p."isFuture" IS NOT TRUE AND
        p."shortform" IS NOT TRUE AND
        p."hiddenRelatedQuestion" IS NOT TRUE AND
        p."groupId" IS NULL
        ${filter}
      ORDER BY p."score" DESC
      LIMIT $(count)
    `, {
      postId,
      userId: currentUser?._id,
      postStatus: postStatuses.STATUS_APPROVED,
      count,
      maxRecommendationCount: this.maxRecommendationCount,
      ...args,
    });
  }
}

export default RecommendationStrategy;
