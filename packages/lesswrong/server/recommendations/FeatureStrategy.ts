import RecommendationStrategy from "./RecommendationStrategy";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { featureRegistry } from "./Feature";

/**
 * The feature strategy can be used to combine multiple composable "features" that
 * contribute to a score. Features should extend the `Feature` abstract class and
 * should return a score between 0 and 1 that can then be multiplied by a weight
 * when sorting results.
 */
class FeatureStrategy extends RecommendationStrategy {
  async recommend(
    currentUser: DbUser|null,
    count: number,
    {postId, features}: StrategySpecification,
  ): Promise<DbPost[]> {
    if (!features) {
      throw new Error("No features supplied to FeatureStrategy");
    }

    const db = getSqlClientOrThrow();

    const userFilter = this.getUserFilter(currentUser);
    const postFilter = this.getDefaultPostFilter();
    const tagFilter = this.getTagFilter();

    let joins = "";
    let filters = "";
    let score = "";
    let args = {};

    for (const {feature: featureName, weight} of features) {
      const feature = new featureRegistry[featureName]();
      joins += ` ${feature.getJoin()}`;
      filters += ` ${feature.getFilter()}`;
      const weightName = `${featureName}Weight`;
      score += ` + ($(${weightName}) * (${feature.getScore()}))`;
      args = {...args, ...feature.getArgs(), [weightName]: weight};
    }

    return db.any(`
      SELECT p.*
      FROM "Posts" p
      ${userFilter.join}
      ${postFilter.join}
      ${joins}
      WHERE
        p."_id" <> $(postId) AND
        ${filters}
        ${userFilter.filter}
        ${postFilter.filter}
        ${tagFilter.filter}
      ORDER BY 0 ${score} DESC
      LIMIT $(count)
    `, {
      ...userFilter.args,
      ...postFilter.args,
      ...tagFilter.args,
      ...args,
      postId,
      count,
    });
  };
}

export default FeatureStrategy;
