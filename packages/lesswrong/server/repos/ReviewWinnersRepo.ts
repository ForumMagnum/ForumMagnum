import { ReviewWinnerWithPostTitle } from "../../components/sequences/TopPostsPage";
import ReviewWinners from "../../lib/collections/reviewWinners/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

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
          WHERE "curatedOrder" < $(newCuratedOrder)
          AND "curatedOrder" > $(currentOrder);

          UPDATE "ReviewWinners"
          SET "curatedOrder" = $(newCuratedOrder)
          WHERE _id = $(reviewWinnerId);
        `, { newCuratedOrder, currentOrder, reviewWinnerId });
      }
    });
  }

  async getAllReviewWinnersWithPostTitles(): Promise<ReviewWinnerWithPostTitle[]> {
    const reviewWinnersWithPostTitles = await this.getRawDb().any<DbReviewWinner & { postTitle: string }>(`
      SELECT
        rw.*,
        p.title AS "postTitle"
      FROM "ReviewWinners" rw
      JOIN "Posts" p
      ON rw."postId" = p._id
    `);

    return reviewWinnersWithPostTitles.map(reviewWinnerWithPostTitle => {
      const { postTitle, ...reviewWinner } = reviewWinnerWithPostTitle;
      return {
        reviewWinner,
        postTitle
      };
    })
  }
}

recordPerfMetrics(ReviewWinnersRepo);

export default ReviewWinnersRepo;