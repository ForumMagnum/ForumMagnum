import gql from "graphql-tag";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { getRejectionReview, type AppealTarget } from "@/server/collections/rejectionAppeals/helpers";

export const rejectionReviewTypeDefs = gql`
  type RejectionReview {
    post: Post
    comment: Comment
    appeal: RejectionAppeal
    reasonIds: [String!]!
    unavailableReason: String
  }
  extend type Query {
    rejectionReview(postId: String, commentId: String): RejectionReview!
  }
`;

export const rejectionReviewQueries = {
  async rejectionReview(_root: void, target: AppealTarget, context: ResolverContext) {
    const review = await getRejectionReview(target, context);
    const { currentUser } = context;
    return {
      ...review,
      post: review.post && await accessFilterSingle(currentUser, "Posts", review.post, context),
      comment: review.comment && await accessFilterSingle(currentUser, "Comments", review.comment, context),
      appeal: review.appeal && await accessFilterSingle(currentUser, "RejectionAppeals", review.appeal, context),
    };
  },
};
