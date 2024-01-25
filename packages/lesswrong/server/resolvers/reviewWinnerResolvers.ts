import { userIsAdmin } from "../../lib/vulcan-users";
import { defineMutation, defineQuery } from "../utils/serverGraphqlUtil";

defineQuery({
  name: 'GetAllReviewWinners',
  schema: `
  type ReviewWinnerWithPostTitle {
    reviewWinner: ReviewWinner!
    postTitle: String!
  }
  `,
  resultType: '[ReviewWinnerWithPostTitle!]!',
  fn: async (root, args, context) => {
    const { currentUser } = context;

    if (!userIsAdmin(currentUser)) {
      throw new Error('Only admins may fetch all review winners using this API!');
    }

    return await context.repos.reviewWinners.getAllReviewWinnersWithPostTitles();
  }
})

defineMutation({
  name: 'UpdateReviewWinnerOrder',
  resultType: '[ReviewWinnerWithPostTitle!]!',
  argTypes: '(reviewWinnerId: String!, newCuratedOrder: Int!)',
  fn: async (_, { reviewWinnerId, newCuratedOrder }: { reviewWinnerId: string, newCuratedOrder: number }, context) => {
    const { currentUser } = context;

    if (!userIsAdmin(currentUser)) {
      throw new Error('Only admins may update review winner ordering!');
    }

    // const updates: MongoBulkWriteOperations<DbReviewWinner> = orderedReviewWinnerIds.map((reviewWinnerId, idx) => ({
    //   updateOne: {
    //     filter: { _id: reviewWinnerId },
    //     update: { $set: { curatedOrder: idx } }
    //   }
    // }));

    // await context.ReviewWinners.rawCollection().bulkWrite(updates);

    await context.repos.reviewWinners.updateCuratedOrder(reviewWinnerId, newCuratedOrder);

    // return true;

    return await context.repos.reviewWinners.getAllReviewWinnersWithPostTitles(); //.find(undefined, { sort: { curatedOrder: 1 } }).fetch();
  }
});
