import { StrategySpecification } from "../../lib/collections/users/recommendationSettings";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { postStatuses } from "../../lib/collections/posts/constants";
import { EA_FORUM_COMMUNITY_TOPIC_ID } from "../../lib/collections/tags/collection";

export type RecommendationStrategyConfig = {
  maxRecommendationCount: number,
  minimumBaseScore: number,
}

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
  ): Promise<DbPost[]>;

  protected getUserFilter(currentUser: DbUser|null) {
    return currentUser
      ? {
        join: `
          LEFT JOIN "ReadStatuses" rs
            ON rs."userId" = $(userId)
            AND rs."postId" = p."_id"
          LEFT JOIN "PostRecommendations" pr
            ON pr."userId" = $(userId)
            AND pr."postId" = p."_id"
        `,
        filter: `
          rs."isRead" IS NOT TRUE AND
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

  protected getDefaultPostFilter() {
    return {
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
      `,
      args: {
        postStatus: postStatuses.STATUS_APPROVED,
        minimumBaseScore: this.config.minimumBaseScore,
      },
    };
  }

  protected getCommunityFilter() {
    return {
      filter: `COALESCE((p."tagRelevance"->>$(communityId))::INTEGER, 0) < 1`,
      args: {
        communityId: EA_FORUM_COMMUNITY_TOPIC_ID,
      },
    };
  }

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
