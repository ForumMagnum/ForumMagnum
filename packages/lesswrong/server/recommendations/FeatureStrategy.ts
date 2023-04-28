import RecommendationStrategy from "./RecommendationStrategy";
import type {
  StrategySpecification,
  RecommendationFeatureName,
} from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";

abstract class Feature {
  getJoin(): string {
    return "";
  }

  getFilter(): string {
    return "";
  }

  getScore(): string {
    return "";
  }

  getArgs(): Record<string, unknown> {
    return {};
  }
}

class KarmaFeature extends Feature {
  getScore() {
    return `p."baseScore" / 1000`;
  }
}

class CuratedFeature extends Feature {
  getScore() {
    return `CASE WHEN p."curatedDate" IS NULL THEN 0 ELSE 1 END`;
  }
}

class TagSimilarityFeature extends Feature {
  getScore() {
    return `fm_post_tag_similarity($(postId), p."_id")`;
  }
}

class CollabFilterFeature extends Feature {
  getJoin() {
    return `INNER JOIN "UniquePostUpvoters" rec ON rec."postId" = p."_id"`;
  }

  getScore() {
    const srcVoters = `(
      SELECT voters
      FROM "UniquePostUpvoters"
      WHERE "postId" = $(postId)
    )`;
    return `
      COALESCE(
        (# (${srcVoters} & rec.voters))::FLOAT /
          NULLIF((# (${srcVoters} | rec.voters))::FLOAT, 0),
        0
      )
    `;
  }
}

type ConstructableFeature = {
  new(): Feature;
}

/**
 * The feature strategy can be used to combine multiple composable "features" that
 * contribute to a score. Features should extend the `Feature` abstract class and
 * should return a score between 0 and 1 that can then be multiplied by a weight
 * when sorting results.
 */
class FeatureStrategy extends RecommendationStrategy {
  private static readonly featureRegistry: Record<
    RecommendationFeatureName,
    ConstructableFeature
  > = {
    karma: KarmaFeature,
    curated: CuratedFeature,
    tagSimilarity: TagSimilarityFeature,
    collabFilter: CollabFilterFeature,
  };

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
      const feature = new FeatureStrategy.featureRegistry[featureName]();
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
