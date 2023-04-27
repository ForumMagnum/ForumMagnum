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

  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId, bias}: StrategySpecification,
  ): Promise<DbPost[]> {
    const db = getSqlClientOrThrow();
    const userFilter = this.getUserFilter(currentUser);
    const postFilter = this.getDefaultPostFilter();
    const tagFilter = this.getTagFilter();
    const srcVoters = `(
      SELECT voters
      FROM "UniquePostUpvoters"
      WHERE "postId" = $(postId)
    )`;
    const tagWeighting = this.weightByTagSimilarity
      ? `+ (fm_post_tag_similarity($(postId), p."_id") * $(bias))`
      : "";
    return db.any(`
      SELECT p.*
      FROM "Posts" p
      INNER JOIN "UniquePostUpvoters" rec ON rec."postId" = p."_id"
      ${postFilter.join}
      ${userFilter.join}
      WHERE
        p."_id" <> $(postId) AND
        ${postFilter.filter}
        ${userFilter.filter}
        ${tagFilter.filter}
      ORDER BY
        COALESCE((# (${srcVoters} & rec.voters))::FLOAT /
          NULLIF((# (${srcVoters} | rec.voters))::FLOAT, 0), 0) ${tagWeighting} DESC,
        p."baseScore" DESC
      LIMIT $(count)
    `, {
      ...userFilter.args,
      ...postFilter.args,
      ...tagFilter.args,
      postId,
      count,
      bias: bias ?? 1,
    });
  };
}

export default CollabFilterStrategy;
