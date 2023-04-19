import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";

class CollabFilterStrategy extends RecommendationStrategy {
  constructor() {
    super({
      minimumBaseScore: 10,
    });
  }

  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId}: StrategySpecification,
  ): Promise<DbPost[]> {
    const db = getSqlClientOrThrow();
    const userFilter = this.getUserFilter(currentUser);
    const postFilter = this.getDefaultPostFilter();
    const communityFilter = this.getCommunityFilter();
    const hash = `('x' || SUBSTR(MD5("Votes"."userId"), 1, 8))::BIT(32)::INTEGER`;
    const voteFilter = `
      "Votes"."collectionName" = 'Posts' AND
      "Votes"."cancelled" IS NOT TRUE AND
      "Votes"."isUnvote" IS NOT TRUE AND
      "Votes"."voteType" IN ('smallUpvote', 'bigUpvote')
    `;
    return db.any(`
      SELECT p.*
      FROM (
        SELECT
          "Votes"."documentId" AS "postId",
          ARRAY_AGG(DISTINCT ${hash}) AS "voters",
          (
            SELECT ARRAY_AGG(DISTINCT ${hash}) AS "src_voters"
            FROM "Votes"
            WHERE
              "Votes"."documentId" = $(postId) AND
              ${voteFilter}
            GROUP BY "Votes"."documentId"
          ) as "src_voters"
        FROM "Votes"
        JOIN "Posts" p ON p."_id" = "Votes"."documentId"
        ${userFilter.join}
        WHERE
          "Votes"."documentId" <> $(postId) AND
          ${postFilter.filter}
          ${communityFilter.filter} AND
          ${userFilter.filter}
          ${voteFilter}
        GROUP BY "Votes"."documentId"
      ) target
      JOIN "Posts" p ON p."_id" = target."postId"
      ORDER BY (# (voters & src_voters))::FLOAT / (# (voters | src_voters))::FLOAT DESC
      LIMIT $(count)
    `, {
      ...userFilter.args,
      ...postFilter.args,
      ...communityFilter.args,
      postId,
      count,
    });
  };
}

export default CollabFilterStrategy;
