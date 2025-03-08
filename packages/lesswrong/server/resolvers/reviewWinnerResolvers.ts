import { restrictViewableFieldsSingle } from "../../lib/vulcan-users/permissions";
import { defineQuery } from "../utils/serverGraphqlUtil";
import { splashArtCoordinateCache } from "@/server/review/splashArtCoordinatesCache";
import { reviewWinnerCache, ReviewWinnerWithPost } from "@/server/review/reviewWinnersCache";
import { isLWorAF } from "../../lib/instanceSettings";


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

defineQuery({
  name: 'GetAllReviewWinners',
  resultType: '[Post!]!',
  fn: async (root, args, context) => {
    const { reviewWinners } = await reviewWinnerCache.get();
    return restrictReviewWinnerPostFields(reviewWinners, context);
  }
});
