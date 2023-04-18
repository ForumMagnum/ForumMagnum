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
    return db.any(`
      WITH target AS (
        SELECT
          "Votes"."documentId" AS "postId",
          ARRAY_AGG(DISTINCT hashtext("Votes"."userId")) AS "voters"
        FROM "Votes"
        WHERE "Votes"."collectionName" = 'Posts'
          AND "Votes"."documentId" <> $(postId)
        GROUP BY "Votes"."documentId"
      ), src AS (
        SELECT ARRAY_AGG(DISTINCT hashtext("Votes"."userId")) AS "src_voters"
        FROM "Votes"
        WHERE "Votes"."collectionName" = 'Posts'
          AND "Votes"."documentId" = $(postId)
        GROUP BY "Votes"."documentId"
      )
      SELECT
        p.*,
        (# (voters & src_voters))::FLOAT / (# (voters | src_voters))::FLOAT
          AS similarity
      FROM target
      CROSS JOIN src
      JOIN "Posts" p ON p."_id" = target."postId"
      ${userFilter.join}
      WHERE
        ${userFilter.filter}
        ${postFilter.filter}
        ${communityFilter.filter}
      ORDER BY similarity DESC
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
