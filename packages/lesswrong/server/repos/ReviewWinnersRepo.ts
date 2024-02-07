import ReviewWinners from "../../lib/collections/reviewWinners/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

export interface ReviewWinnerWithPost {
  reviewWinner: DbReviewWinner;
  post: DbPost;
}

class ReviewWinnersRepo extends AbstractRepo<"ReviewWinners"> {
  constructor() {
    super(ReviewWinners);
  }
  
  async updateCuratedOrder(reviewWinnerId: string, newCuratedOrder: number) {
    await this.getRawDb().tx(async (tx) => {
      const { curatedOrder: currentOrder } = await tx.one<Pick<DbReviewWinner, 'curatedOrder'>>(`
        SELECT "curatedOrder"
        FROM "ReviewWinners"
        WHERE _id = $1
      `, [reviewWinnerId]);

      // Moving it earlier in the curated ranking
      if (newCuratedOrder < currentOrder) {
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
          AND "curatedOrder" < $(currentOrder);

          UPDATE "ReviewWinners"
          SET "curatedOrder" = $(newCuratedOrder)
          WHERE _id = $(reviewWinnerId);
        `, { newCuratedOrder, currentOrder, reviewWinnerId });
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
          AND "curatedOrder" > $(currentOrder);

          UPDATE "ReviewWinners"
          SET "curatedOrder" = $(newCuratedOrder)
          WHERE _id = $(reviewWinnerId);
        `, { newCuratedOrder, currentOrder, reviewWinnerId });
      }
    });
  }

  async getAllReviewWinnersWithPosts(): Promise<ReviewWinnerWithPost[]> {
    const postsWithMetadata = await this.getRawDb().any<DbPost & { reviewWinner: DbReviewWinner }>(`
      SELECT
        TO_JSONB(rw.*) AS "reviewWinner",
        p.*
      FROM "ReviewWinners" rw
      JOIN "Posts" p
      ON rw."postId" = p._id
    `);

    // We need to do this annoying munging in code because `TO_JSONB` causes date fields to be returned without being serialized into JS Date objects
    return postsWithMetadata.map(postWithMetadata => {
      const { reviewWinner, ...post } = postWithMetadata;
      return { reviewWinner, post };
    });
  }

  // async updateSplashArtCoordinateId(reviewWinnerId: string, splashArtCoordinateId: string) {
  //   console.log(`Updating via updateSplashArtCoordinateId. reviewWinnerId: ${reviewWinnerId}, splashArtCoordinateId: ${splashArtCoordinateId}`);
  //   await this.getRawDb().tx(async (tx) => {
  //     await tx.none(`
  //       UPDATE "ReviewWinners"
  //       SET "splashArtCoordinateId" = $(splashArtCoordinateId)
  //       WHERE _id = $(reviewWinnerId);
  //     `, { splashArtCoordinateId, reviewWinnerId });
  //   });
  // }
}

recordPerfMetrics(ReviewWinnersRepo);

export default ReviewWinnersRepo;
