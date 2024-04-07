import RecommendationStrategy, { ContextualRecommendationStrategy, ContextualStrategy, RecommendationResult } from "./RecommendationStrategy";
import type { ContextualStrategySpecification, StrategySpecification } from "../collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../sql/sqlClient";
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
  ): Promise<RecommendationResult<boolean>> {
    if (!features) {
      throw new Error("No features supplied to FeatureStrategy");
    }

    const db = getSqlClientOrThrow();

    const readFilter = this.getAlreadyReadFilter(currentUser);
    const recommendedFilter = this.getAlreadyRecommendedFilter(currentUser);
    const postFilter = this.getDefaultPostFilter();
    const tagFilter = this.getTagFilter();
    const currentPostFilter = this.getExcludeCurrentPostFilter(postId);

    let joins = "";
    let filters = "";
    let score = "";
    let args = {};

    for (const {feature: featureName, weight} of features) {
      if (weight === 0) {
        continue;
      }
      const feature = new featureRegistry[featureName]();
      joins += ` ${feature.getJoin()}`;
      filters += ` ${feature.getFilter()}`;
      const weightName = `${featureName}Weight`;
      score += ` + ($(${weightName}) * (${feature.getScore()}))`;
      args = {...args, ...feature.getArgs(), [weightName]: weight};
    }

    const posts = await db.any(`
      SELECT p.*
      FROM (
        SELECT p.*
        FROM "Posts" p
        ${readFilter.join}
        ${postFilter.join}
        ${joins}
        WHERE
          ${currentPostFilter.filter}
          ${filters}
          ${readFilter.filter}
          ${postFilter.filter}
          ${tagFilter.filter}
        ORDER BY 0 ${score} DESC
        LIMIT $(count) * 10
      ) p
      ${recommendedFilter.join}
      WHERE ${recommendedFilter.filter} 1=1
      LIMIT $(count)
    `, {
      ...currentPostFilter.args,
      ...readFilter.args,
      ...recommendedFilter.args,
      ...postFilter.args,
      ...tagFilter.args,
      ...args,
      count,
    });

    return {posts, settings: {postId, features}};
  }
}

class ContextualFeatureStrategy extends FeatureStrategy implements ContextualStrategy {
  readonly contextual = true;
  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategySpecification: ContextualStrategySpecification,
  ) {
    return super.recommend(currentUser, count, strategySpecification);
  }
}

export { ContextualFeatureStrategy };
export default FeatureStrategy;
