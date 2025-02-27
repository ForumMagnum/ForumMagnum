import { BEST_OF_LESSWRONG_PUBLISH_YEAR } from "@/lib/reviewUtils";
import keyBy from "lodash/keyBy";
import mapValues from "lodash/mapValues";

export type ReviewWinnerWithPost = DbPost & { reviewWinner: DbReviewWinner & { reviewWinnerArt: DbReviewWinnerArt } };

const reviewWinnerCacheExpirationTimeMs = 60*60*1000; //1 hour

interface ReviewWinnerCache {
  reviewWinners: ReviewWinnerWithPost[];
  reviewWinnersByPostId: Record<string, DbReviewWinner>;
  lastUpdatedAt: Date|null;
}

export const REVIEW_WINNER_CACHE: ReviewWinnerCache = {
  reviewWinners: [],
  reviewWinnersByPostId: {},
  lastUpdatedAt: null,
};

export async function updateReviewWinnerCache(context: ResolverContext) {
  console.log("updateReviewWinnerCache");
  // If this is replacing an existing review-winner cache entry, update the
  // last-updated date first, so that subsequent requests don't also attempt to
  // perform the same update.
  if (REVIEW_WINNER_CACHE.lastUpdatedAt) {
    REVIEW_WINNER_CACHE.lastUpdatedAt = new Date();
  }
  const updatedReviewWinners = await context.repos.reviewWinners.getAllReviewWinnersWithPosts();
  REVIEW_WINNER_CACHE.reviewWinners = updatedReviewWinners;
  REVIEW_WINNER_CACHE.reviewWinnersByPostId = mapValues(
    keyBy(updatedReviewWinners, p => p._id),
    p => p.reviewWinner
  );

  REVIEW_WINNER_CACHE.lastUpdatedAt = new Date();
}

export async function getPostReviewWinnerInfo(postId: string, context: ResolverContext): Promise<DbReviewWinner | null> {
  if (!REVIEW_WINNER_CACHE.lastUpdatedAt) {
    // If review-winners list isn't loaded yet (ie, first request close to
    // server startup), wait for it.
    await updateReviewWinnerCache(context);
  } else if (REVIEW_WINNER_CACHE.lastUpdatedAt.getTime() < new Date().getTime() - reviewWinnerCacheExpirationTimeMs) {
    // If review-winners list is expired, reload it but don't wait for the result
    void updateReviewWinnerCache(context);
  }

  return REVIEW_WINNER_CACHE.reviewWinnersByPostId[postId];
}
