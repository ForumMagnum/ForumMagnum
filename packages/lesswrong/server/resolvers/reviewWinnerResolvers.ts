import { restrictViewableFieldsSingle } from "../../lib/vulcan-users/permissions";
import { defineQuery } from "../utils/serverGraphqlUtil";
import { splashArtCoordinateCache } from "@/server/review/splashArtCoordinatesCache";
import { reviewWinnerCache, ReviewWinnerWithPost } from "@/server/review/reviewWinnersCache";
import { isLWorAF } from "../../lib/instanceSettings";
import { createAdminContext } from "../vulcan-lib/query";


export async function initReviewWinnerCache() {
  if (isLWorAF) {
    const context = createAdminContext();
    await Promise.all([
      reviewWinnerCache.get(context),
      splashArtCoordinateCache.get(context),
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
    const { reviewWinners } = await reviewWinnerCache.get(context);
    return restrictReviewWinnerPostFields(reviewWinners, context);
  }
});
