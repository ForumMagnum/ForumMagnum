import { restrictViewableFieldsSingle } from "../../lib/vulcan-users/permissions";
import { defineQuery } from "../utils/serverGraphqlUtil";
import { createAnonymousContext } from "../vulcan-lib/query";
import Posts from "../../lib/collections/posts/collection";
import { splashArtCoordinateCache } from "../../lib/collections/splashArtCoordinates/cache";
import { reviewWinnerCache, ReviewWinnerWithPost } from "../../lib/collections/reviewWinners/cache";
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
    ...restrictViewableFieldsSingle(context.currentUser, Posts, post),
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
