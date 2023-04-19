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
    const srcVoters = `(
      SELECT voters
      FROM "UniquePostUpvoters"
      WHERE "postId" = $(postId)
    )`;
    return db.any(`
      SELECT p.*
      FROM "Posts" p
      INNER JOIN "UniquePostUpvoters" rec ON rec."postId" = p."_id"
      WHERE
        p."_id" <> $(postId) AND
        ${postFilter.filter}
        ${userFilter.filter}
        ${communityFilter.filter}
      ORDER BY
        (# (${srcVoters} & rec.voters))::FLOAT /
          (# (${srcVoters} | rec.voters))::FLOAT DESC,
        p."baseScore" DESC
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
