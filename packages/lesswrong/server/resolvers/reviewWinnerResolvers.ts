import { splashArtCoordinateCache } from "@/server/review/splashArtCoordinatesCache";
import { reviewWinnerPostsCache } from "@/server/review/reviewWinnersCache";
import { isLWorAF } from "../../lib/instanceSettings";
import gql from "graphql-tag";
import { createAnonymousContext } from "../vulcan-lib/createContexts";
import { backgroundTask } from "../utils/backgroundTask";
import { accessFilterMultiple } from '@/lib/utils/schemaUtils';


export async function initReviewWinnerCache() {
  if (isLWorAF()) {
    const context = createAnonymousContext();
    backgroundTask(reviewWinnerPostsCache.get());
    backgroundTask(splashArtCoordinateCache.get(context));
  }
}

export const reviewWinnerGraphQLTypeDefs = () => gql`
  extend type Query {
    GetAllReviewWinners: [Post!]!
  }
`;

export const reviewWinnerGraphQLQueries = {
  GetAllReviewWinners: async (root: void, args: void, context: ResolverContext) => {
    const { reviewWinners } = await reviewWinnerPostsCache.get();
    return accessFilterMultiple(context.currentUser, "Posts", reviewWinners, context);
  }
};
