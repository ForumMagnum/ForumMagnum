import ReviewWinners from "../../server/collections/reviewWinners/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
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

  async getAllReviewWinnerPosts(): Promise<DbPost[]> {
    const reviewWinnerPosts = await this.getRawDb().any<DbPost>(`
      SELECT p.*
      FROM "ReviewWinners" rw
      JOIN "Posts" p
      ON rw."postId" = p._id
      WHERE rw."reviewYear" <= $1
    `, [BEST_OF_LESSWRONG_PUBLISH_YEAR]);

    return reviewWinnerPosts;
  }
}

recordPerfMetrics(ReviewWinnersRepo);

export default ReviewWinnersRepo;
