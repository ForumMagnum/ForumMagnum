import { BEST_OF_LESSWRONG_PUBLISH_YEAR } from "@/lib/reviewUtils";
import keyBy from "lodash/keyBy";
import mapValues from "lodash/mapValues";
import moment from "moment";

export type ReviewWinnerWithPost = DbPost & { reviewWinner: DbReviewWinner & { reviewWinnerArt: DbReviewWinnerArt } };

interface ReviewWinnerCache {
  reviewWinners: ReviewWinnerWithPost[];
  reviewWinnersByPostId: Record<string, DbReviewWinner>;
  lastUpdatedAt: Date;
}

export const REVIEW_WINNER_CACHE: ReviewWinnerCache = {
  reviewWinners: [],
  reviewWinnersByPostId: {},
  lastUpdatedAt: new Date()
};

export async function updateReviewWinnerCache(context: ResolverContext) {
  const updatedReviewWinners = await context.repos.reviewWinners.getAllReviewWinnersWithPosts();
  REVIEW_WINNER_CACHE.reviewWinners = updatedReviewWinners;
  REVIEW_WINNER_CACHE.reviewWinnersByPostId = mapValues(
    keyBy(updatedReviewWinners, p => p._id),
    p => p.reviewWinner
  );
  REVIEW_WINNER_CACHE.lastUpdatedAt = new Date();
}

export async function getPostReviewWinnerInfo(postId: string, context: ResolverContext): Promise<DbReviewWinner | null> {
  const cacheStale = moment(REVIEW_WINNER_CACHE.lastUpdatedAt).isBefore(moment(new Date()).subtract(1, 'hour'));
  if (cacheStale) {
    void updateReviewWinnerCache(context);
  }
  // console.log("REVIEW_WINNER_CACHE.reviewWinnersByPostId[postId]", REVIEW_WINNER_CACHE.reviewWinnersByPostId[postId])
  return (
    REVIEW_WINNER_CACHE.reviewWinnersByPostId[postId] ??
    await context.ReviewWinners.findOne({ postId, reviewYear: {$lte: BEST_OF_LESSWRONG_PUBLISH_YEAR} })
  );
}
