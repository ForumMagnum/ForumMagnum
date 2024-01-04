import AbstractRepo from "./AbstractRepo";
import PostRecommendations from "../../lib/collections/postRecommendations/collection";
import { randomId } from "../../lib/random";
import type {
  RecommendationStrategyName,
  StrategySettings,
} from "../../lib/collections/users/recommendationSettings";
import { recordPerfMetrics } from "./perfMetricWrapper";

class PostRecommendationsRepo extends AbstractRepo<"PostRecommendations"> {
  constructor() {
    super(PostRecommendations);
  }

  async recordRecommendations(
    currentUser: DbUser|null,
    clientId: string|null,
    strategyName: RecommendationStrategyName,
    strategySettings: StrategySettings,
    posts: DbPost[],
  ): Promise<void> {
    const userId = currentUser?._id;
    if (userId) {
      clientId = null;
    } else if (!clientId) {
      return;
    }
    const settings = strategySettings as unknown as JsonRecord;
    await Promise.all(posts.map(({_id: postId}) => this.none(`
      -- PostRecommendationsRepo.recordRecommendations
      INSERT INTO "PostRecommendations" (
        "_id",
        "userId",
        "clientId",
        "postId",
        "strategyName",
        "strategySettings",
        "recommendationCount",
        "lastRecommendedAt",
        "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) ON CONFLICT (
        COALESCE("userId", ''),
        COALESCE("clientId", ''),
        "postId"
      ) DO UPDATE SET
        "strategyName" = $5,
        "strategySettings" = $6,
        "lastRecommendedAt" = CURRENT_TIMESTAMP
    `, [randomId(), userId, clientId, postId, strategyName, settings])));
  }

  async markRecommendationAsObserved(
    userId: string | null,
    clientId: string | null,
    postId: string,
  ): Promise<void> {
    if (userId) {
      await this.none(`
        -- PostRecommendationsRepo.markRecommendationAsObserved
        UPDATE "PostRecommendations"
        SET "recommendationCount" = "recommendationCount" + 1
        WHERE "userId" = $1 AND "postId" = $2
      `, [userId, postId]);
    } else if (clientId) {
      await this.none(`
        -- PostRecommendationsRepo.markRecommendationAsObserved
        UPDATE "PostRecommendations"
        SET "recommendationCount" = "recommendationCount" + 1
        WHERE "clientId" = $1 AND "postId" = $2
      `, [clientId, postId]);
    }
  }

  async markRecommendationAsClicked(
    userId: string | null,
    clientId: string | null,
    postId: string,
  ): Promise<void> {
    if (userId) {
      await this.none(`
        -- PostRecommendationsRepo.markRecommendationAsClicked
        UPDATE "PostRecommendations"
        SET "clickedAt" = CURRENT_TIMESTAMP
        WHERE "userId" = $1 AND "postId" = $2
      `, [userId, postId]);
    } else if (clientId) {
      await this.none(`
        -- PostRecommendationsRepo.markRecommendationAsClicked
        UPDATE "PostRecommendations"
        SET "clickedAt" = CURRENT_TIMESTAMP
        WHERE "clientId" = $1 AND "postId" = $2
      `, [clientId, postId]);
    }
  }

  async clearStaleRecommendations(): Promise<void> {
    // Delete all recommedations that are at least 1 day old and that
    // never appeared above the fold
    await this.none(`
      -- PostRecommendationsRepo.clearStaleRecommendations
      DELETE
      FROM "PostRecommendations"
      WHERE
        "recommendationCount" < 1 AND
        (CURRENT_TIMESTAMP - "createdAt") > '1 day'
    `);
    // Delete all recommendations that were never clicked that were last
    // recommended at least 3 months ago
    // This is currently disabled as it will ruin the analytics - if we
    // want to enable this is the future then we should probably move
    // the data into a separate "archive" table instead of completely
    // deleting it.
    /*
    await this.none(`
      -- PostRecommendationsRepo.clearStaleRecommendations
      DELETE
      FROM "PostRecommendations"
      WHERE
        "clickedAt" IS NULL AND
        (CURRENT_TIMESTAMP - "createdAt") > '3 months'
    `);
    */
  }
}

recordPerfMetrics(PostRecommendationsRepo);

export default PostRecommendationsRepo;
