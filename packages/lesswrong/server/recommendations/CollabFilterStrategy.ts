import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";

/**
 * This class implements a simple item-item collaborative filtering algorithm for
 * post recommendations. It works by storing the set of unique upvoters for each
 * post in a materialized view called `UniquePostUpvoters`. We then compute the
 * Jaccard index between the source post and each recommendable target post,
 * returning the posts with the highest indices.
 */
class CollabFilterStrategy extends RecommendationStrategy {
  protected weightByTagSimilarity = false;

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
    const tagWeighting = this.weightByTagSimilarity
      ? `+ fm_post_tag_similarity($(postId), p."_id")`
      : "";
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
          (# (${srcVoters} | rec.voters))::FLOAT ${tagWeighting} DESC,
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
