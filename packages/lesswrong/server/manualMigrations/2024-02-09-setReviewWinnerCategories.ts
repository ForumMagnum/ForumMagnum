import ReviewWinners from "../../lib/collections/reviewWinners/collection";
import { updateMutator } from "../vulcan-lib";
import { createAdminContext } from "../vulcan-lib/query";
import { registerMigration } from "./migrationUtils";

interface ReviewWinnerCategoryAndOrder {
  _id: string;
  category: DbReviewWinner['category'];
  curatedOrder: number;
}

const reviewWinnerCategories: ReviewWinnerCategoryAndOrder[] = [];

registerMigration({
  name: "setReviewWinnerCategories",
  dateWritten: "2024-02-09",
  idempotent: true,
  action: async () => {
    const adminContext = createAdminContext();

    for (let { _id, category, curatedOrder } of reviewWinnerCategories) {
      await updateMutator({
        collection: ReviewWinners,
        documentId: _id,
        set: {
          category,
          curatedOrder
        },
        context: adminContext,
        currentUser: adminContext.currentUser
      });
    }
  }
});
