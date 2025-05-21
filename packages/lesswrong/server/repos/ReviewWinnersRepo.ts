import ReviewWinners from "../../server/collections/reviewWinners/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import type { ReviewWinnerWithPost } from "@/server/review/reviewWinnersCache";
import { BEST_OF_LESSWRONG_PUBLISH_YEAR } from "../../lib/reviewUtils";

class ReviewWinnersRepo extends AbstractRepo<"ReviewWinners"> {
  constructor() {
    super(ReviewWinners);
  }
  
  async updateCuratedOrder(reviewWinnerId: string, newCuratedOrder: number) {
    await this.getRawDb().tx(async (tx) => {
      const { curatedOrder: currentOrder, category } = await tx.one<Pick<DbReviewWinner, 'curatedOrder' | 'category'>>(`
        SELECT "curatedOrder", "category"
        FROM "ReviewWinners"
        WHERE _id = $1
      `, [reviewWinnerId]);

      // Moving it earlier in the curated ranking
      if (currentOrder === null || newCuratedOrder < currentOrder) {
        await tx.none(`
          UPDATE "ReviewWinners"
          SET "curatedOrder" = (SELECT MAX("curatedOrder") + 1 FROM "ReviewWinners")
          WHERE _id = $(reviewWinnerId);
          
          UPDATE "ReviewWinners"
          -- Increment curatedOrder (shifting them to the "right") for all review winners whose orders fall between
          -- the newCuratedOrder (the "leftmost" boundary, hence the inclusive ">=" comparison), and
          -- the old currentOrder (the "rightmost" boundary, hence the "<" comparison)
          SET "curatedOrder" = "curatedOrder" + 1
          WHERE "curatedOrder" >= $(newCuratedOrder)
          AND ($(currentOrder) IS NULL OR "curatedOrder" < $(currentOrder))
          AND "category" = $(category);

          UPDATE "ReviewWinners"
          SET "curatedOrder" = $(newCuratedOrder)
          WHERE _id = $(reviewWinnerId);
        `, { newCuratedOrder, currentOrder, reviewWinnerId, category });
      // Moving it later in the curated ranking
      } else if (newCuratedOrder > currentOrder) {
        await tx.none(`
          UPDATE "ReviewWinners"
          SET "curatedOrder" = (SELECT MAX("curatedOrder") + 1 FROM "ReviewWinners")
          WHERE _id = $(reviewWinnerId);

          UPDATE "ReviewWinners"
          -- Decrement curatedOrder (shifting them to the "left") for all review winners whose orders fall between
          -- the newCuratedOrder (the "rightmost" boundary, hence the "<" comparison), and
          -- the old currentOrder (the "leftmost" boundary, hence the ">" comparison)
          SET "curatedOrder" = "curatedOrder" - 1
          WHERE "curatedOrder" <= $(newCuratedOrder)
          AND "curatedOrder" > $(currentOrder)
          AND "category" = $(category);

          UPDATE "ReviewWinners"
          SET "curatedOrder" = $(newCuratedOrder)
          WHERE _id = $(reviewWinnerId);
        `, { newCuratedOrder, currentOrder, reviewWinnerId, category });
      }
    });
  }

  async getAllReviewWinnersWithPosts(): Promise<ReviewWinnerWithPost[]> {
    // We're doing some jank here that's basically identical to `ReviewWinnerArtsRepo.getActiveReviewWinnerArt`
    // This is to avoid an n+1 when fetching all the review winners on the best of lesswrong page,
    // which would otherwise be caused by the gql resolver for the reviewWinnerArt field on reviewWinner
    const postsWithMetadata = await this.getRawDb().any<DbPost & { reviewWinner: DbReviewWinner, reviewWinnerArt: DbReviewWinnerArt }>(`
      SELECT
        TO_JSONB(rw.*) AS "reviewWinner",
        (
          SELECT TO_JSONB(rwa.*)
          FROM "ReviewWinnerArts" AS rwa
          JOIN "SplashArtCoordinates" AS sac
          ON sac."reviewWinnerArtId" = rwa._id
          WHERE rwa."postId" = p._id
          ORDER BY sac."createdAt" DESC
          LIMIT 1    
        ) AS "reviewWinnerArt",
        (
          SELECT TO_JSONB(s.*)
          FROM "Spotlights" s
          WHERE s."documentId" = p._id
          AND s."draft" IS false
          AND s."deletedDraft" IS false
          ORDER BY s."createdAt" DESC
          LIMIT 1
        ) AS "spotlight",
        p.*
      FROM "ReviewWinners" rw
      JOIN "Posts" p
      ON rw."postId" = p._id
      WHERE rw."reviewYear" <= $1
    `, [BEST_OF_LESSWRONG_PUBLISH_YEAR]);

    // We need to do this annoying munging in code because `TO_JSONB` causes date fields to be returned without being serialized into JS Date objects
    return postsWithMetadata.map(postWithMetadata => {
      const { reviewWinner, reviewWinnerArt, ...post } = postWithMetadata;
      return Object.assign(post, { reviewWinner: Object.assign(reviewWinner, { reviewWinnerArt }) });
    });
  }
}

recordPerfMetrics(ReviewWinnersRepo);

export default ReviewWinnersRepo;
