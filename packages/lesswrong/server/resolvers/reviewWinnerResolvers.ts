import { restrictViewableFieldsSingle } from "../../lib/vulcan-users/permissions";
import { defineQuery } from "../utils/serverGraphqlUtil";
import { splashArtCoordinateCache } from "@/server/review/splashArtCoordinatesCache";
import { reviewWinnerCache, ReviewWinnerWithPost } from "@/server/review/reviewWinnersCache";
import { isLWorAF } from "../../lib/instanceSettings";
import gql from "graphql-tag";


export async function initReviewWinnerCache() {
  if (isLWorAF) {
    await Promise.all([
      reviewWinnerCache.get(),
      splashArtCoordinateCache.get(),
    ]);
  }
}

function restrictReviewWinnerPostFields(reviewWinners: ReviewWinnerWithPost[], context: ResolverContext) {
  return reviewWinners.map(({ reviewWinner, ...post }) => ({
    ...restrictViewableFieldsSingle(context.currentUser, 'Posts', post),
    reviewWinner
  }));
}

export const reviewWinnerGraphQLTypeDefs = gql`
  extend type Query {
    getAllReviewWinners: [Post!]!
  }
`;

export const reviewWinnerGraphQLQueries = {
  getAllReviewWinners: async (root: void, args: void, context: ResolverContext) => {
    const { reviewWinners } = await reviewWinnerCache.get();
    return restrictReviewWinnerPostFields(reviewWinners, context);
  }
};