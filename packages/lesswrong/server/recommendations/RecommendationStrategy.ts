import { StrategySettings, StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { postStatuses } from "../../lib/collections/posts/constants";
import {
  EA_FORUM_COMMUNITY_TOPIC_ID,
  EA_FORUM_APRIL_FOOLS_DAY_TOPIC_ID,
} from "../../lib/collections/tags/helpers";

export type RecommendationStrategyConfig = {
  maxRecommendationCount: number,
  minimumBaseScore: number,
}

export type RecommendationResult = {
  posts: DbPost[],
  settings: StrategySettings,
}

/**
 * The recommendation system is built on smaller, self-contained, modular "strategies"
 * which are all descended from this base class.
 *
 * External code should access this functionality through the `RecommendationService`
 * rather than using this directly.
 */
abstract class RecommendationStrategy {
  private readonly config: RecommendationStrategyConfig;

  constructor(config: Partial<RecommendationStrategyConfig> = {}) {
    this.config = {
      maxRecommendationCount: config.maxRecommendationCount ?? 3,
      minimumBaseScore: config.minimumBaseScore ?? 30,
    };
  }

  abstract recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<RecommendationResult>;

  /**
   * Create SQL query fragments that filter out posts that the user has already
   * viewed.
   */
  protected getAlreadyReadFilter(currentUser: DbUser|null) {
    return currentUser
      ? {
        join: `
          LEFT JOIN "ReadStatuses" rs
            ON rs."userId" = $(userId)
            AND rs."postId" = p."_id"
        `,
        filter: `
          rs."isRead" IS NOT TRUE AND
        `,
        args: {
          userId: currentUser._id,
        },
      }
      : {
        join: "",
        filter: "",
        args: {},
      };
  }

  /**
   * Create SQL query fragments that filter out posts that the user has already
   * been recommended.
   */
  protected getAlreadyRecommendedFilter(currentUser: DbUser|null) {
    return currentUser
      ? {
        join: `
          LEFT JOIN "PostRecommendations" pr
            ON pr."userId" = $(userId)
            AND pr."postId" = p."_id"
        `,
        filter: `
          COALESCE(pr."recommendationCount", 0) < $(maxRecommendationCount) AND
          pr."clickedAt" IS NULL AND
        `,
        args: {
          userId: currentUser._id,
          maxRecommendationCount: this.config.maxRecommendationCount,
        },
      }
      : {
        join: "",
        filter: "",
        args: {},
      };
  }

  /**
   * Create SQL query fragments that filter out posts that the user has already
   * viewed, or that have already been recommended.
   */
  protected getUserFilter(currentUser: DbUser|null) {
    const read = this.getAlreadyReadFilter(currentUser);
    const recommended = this.getAlreadyRecommendedFilter(currentUser);
    return {
      join: `${read.join} ${recommended.join}`,
      filter: `${read.filter} ${recommended.filter}`,
      args: {
        ...read.args,
        ...recommended.args,
      },
    };
  }

  /**
   * Create SQL query fragments that filter out non-recommendable posts. This includes
   * applying a base score, excluding posts that are explicitly marked as not
   * suitable for recommendations, and all of the filters from the default view of the
   * Posts collection.
   */
  protected getDefaultPostFilter() {
    return {
      join: `
        JOIN "Users" author ON author."_id" = p."userId"
      `,
      filter: `
        p."status" = $(postStatus) AND
        p."draft" IS NOT TRUE AND
        p."deletedDraft" IS NOT TRUE AND
        p."isFuture" IS NOT TRUE AND
        p."shortform" IS NOT TRUE AND
        p."hiddenRelatedQuestion" IS NOT TRUE AND
        p."groupId" IS NULL AND
        p."isEvent" IS NOT TRUE AND
        p."baseScore" >= $(minimumBaseScore) AND
        p."disableRecommendation" IS NOT TRUE AND
        author."deleted" IS NOT TRUE AND
      `,
      args: {
        postStatus: postStatuses.STATUS_APPROVED,
        minimumBaseScore: this.config.minimumBaseScore,
      },
    };
  }

  /**
   * Create SQL query fragments to exclude posts tagged with non-recommendable
   * tags.
   */
  protected getTagFilter() {
    return {
      filter: `
        COALESCE((p."tagRelevance"->>$(communityTagId))::INTEGER, 0) < 1 AND
        COALESCE((p."tagRelevance"->>$(aprilFoolsDayTagId))::INTEGER, 0) < 1
      `,
      args: {
        communityTagId: EA_FORUM_COMMUNITY_TOPIC_ID,
        aprilFoolsDayTagId: EA_FORUM_APRIL_FOOLS_DAY_TOPIC_ID,
      },
    };
  }

  /**
   * Find posts in the database using a particular SQL filter, whilst applying
   * the default filters for users, posts and tags.
   */
  protected recommendDefaultWithPostFilter(
    currentUser: DbUser|null,
    count: number,
    postId: string,
    filter: string,
    args: Record<string, unknown> = {},
    sort: keyof DbPost = "score",
  ): Promise<DbPost[]> {
    const db = getSqlClientOrThrow();
    const userFilter = this.getUserFilter(currentUser);
    const postFilter = this.getDefaultPostFilter();
    return db.any(`
      SELECT p.*
      FROM "Posts" p
      ${userFilter.join}
      ${postFilter.join}
      WHERE
        p."_id" <> $(postId) AND
        ${userFilter.filter}
        ${postFilter.filter}
        ${filter}
      ORDER BY p."${sort}" DESC
      LIMIT $(count)
    `, {
      postId,
      userId: currentUser?._id,
      count,
      ...userFilter.args,
      ...postFilter.args,
      ...args,
    });
  }
}

export default RecommendationStrategy;
