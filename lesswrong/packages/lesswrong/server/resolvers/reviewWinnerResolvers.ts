import moment from "moment";
import { restrictViewableFieldsSingle } from "../../lib/vulcan-users";
import { defineQuery } from "../utils/serverGraphqlUtil";
import { createAnonymousContext } from "../vulcan-lib";
import Posts from "../../lib/collections/posts/collection";
import { updateSplashArtCoordinateCache } from "../../lib/collections/splashArtCoordinates/cache";
import { REVIEW_WINNER_CACHE, ReviewWinnerWithPost, updateReviewWinnerCache } from "../../lib/collections/reviewWinners/cache";
import { isLWorAF } from "../../lib/instanceSettings";


export async function initReviewWinnerCache() {
  if (isLWorAF) {
    const context = createAnonymousContext();
    await Promise.all([
      updateReviewWinnerCache(context),
      updateSplashArtCoordinateCache(context),
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
    const cacheStale = moment(REVIEW_WINNER_CACHE.lastUpdatedAt).isBefore(moment(new Date()).subtract(1, 'hour'));
    if (cacheStale) {
      await updateReviewWinnerCache(context);
    }

    return restrictReviewWinnerPostFields(REVIEW_WINNER_CACHE.reviewWinners, context);
  }
});
