import { restrictViewableFieldsSingle } from '@/lib/vulcan-users/restrictViewableFields';
import { splashArtCoordinateCache } from "@/server/review/splashArtCoordinatesCache";
import { reviewWinnerCache, ReviewWinnerWithPost } from "@/server/review/reviewWinnersCache";
import { isLWorAF } from "../../lib/instanceSettings";
import gql from "graphql-tag";
import { createAdminContext } from "../vulcan-lib/createContexts";


export async function initReviewWinnerCache() {
  if (isLWorAF) {
    const context = createAdminContext();
    await Promise.all([
      reviewWinnerCache.get(context),
      splashArtCoordinateCache.get(context),
    ]);
  }
}

async function restrictReviewWinnerPostFields(reviewWinners: ReviewWinnerWithPost[], context: ResolverContext) {
  return Promise.all(reviewWinners.map(async ({ reviewWinner, ...post }) => ({
    ...(await restrictViewableFieldsSingle(context.currentUser, 'Posts', post)),
    reviewWinner
  })));
}

export const reviewWinnerGraphQLTypeDefs = gql`
  extend type Query {
    GetAllReviewWinners: [Post!]!
  }
`;

export const reviewWinnerGraphQLQueries = {
  GetAllReviewWinners: async (root: void, args: void, context: ResolverContext) => {
    const { reviewWinners } = await reviewWinnerCache.get(context);
    return restrictReviewWinnerPostFields(reviewWinners, context);
  }
};
