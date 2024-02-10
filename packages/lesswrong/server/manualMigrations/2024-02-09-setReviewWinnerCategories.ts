import { Posts } from "../../lib/collections/posts";
import ReviewWinners from "../../lib/collections/reviewWinners/collection";
import { updateMutator } from "../vulcan-lib";
import { createAdminContext } from "../vulcan-lib/query";
import { registerMigration } from "./migrationUtils";

interface ReviewWinnerCategoryAndOrder {
  title: string;
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

    for (let { title, category, curatedOrder } of reviewWinnerCategories) {
      const dbPost = await Posts.findOne({ title })
      if (!dbPost) throw new Error(`Post with title ${title} not found`);
      await updateMutator({
        collection: ReviewWinners,
        documentId: dbPost._id,
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
