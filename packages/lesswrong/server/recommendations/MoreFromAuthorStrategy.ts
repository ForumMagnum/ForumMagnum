import RecommendationStrategy from "./RecommendationStrategy";
import { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { postStatuses } from "../../lib/collections/posts/constants";

export class MoreFromAuthorStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]> {
    const {postId, authorId} = strategy;
    if (!postId) {
      throw new Error("No post specified in recommendation strategy");
    }
    if (!authorId) {
      throw new Error("No author specified in recommendation strategy");
    }
    const db = getSqlClientOrThrow();
    const userJoin = currentUser
      ? `
        LEFT JOIN "ReadStatuses" rs
          ON rs."userId" = $3
          AND rs."postId" = p."_id"
      `
      : "";
    const userFilter = currentUser
      ? `
        rs."isRead" IS NOT TRUE AND
      `
      : "";
    return db.any(`
      SELECT p.*
      FROM "Posts" p
      ${userJoin}
      WHERE
        ${userFilter}
        p."userId" = $1 AND
        p."_id" <> $2 AND
        p."status" = $5 AND
        p."draft" IS NOT TRUE AND
        p."deletedDraft" IS NOT TRUE AND
        p."isFuture" IS NOT TRUE AND
        p."shortform" IS NOT TRUE AND
        p."hiddenRelatedQuestion" IS NOT TRUE AND
        p."groupId" IS NULL
      ORDER BY p."score" DESC
      LIMIT $4
    `, [authorId, postId, currentUser?._id, count, postStatuses.STATUS_APPROVED]);
  };
}

export default MoreFromAuthorStrategy;
