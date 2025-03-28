import { BEST_OF_LESSWRONG_PUBLISH_YEAR } from "@/lib/reviewUtils";
import { SwrCache } from "@/lib/utils/swrCache";
import ReviewWinnersRepo from "@/server/repos/ReviewWinnersRepo";
import keyBy from "lodash/keyBy";
import mapValues from "lodash/mapValues";

export type ReviewWinnerWithPost = DbPost & { reviewWinner: DbReviewWinner & { reviewWinnerArt: DbReviewWinnerArt } };

export const reviewWinnerCache = new SwrCache<{
  reviewWinners: ReviewWinnerWithPost[],
  reviewWinnersByPostId: Record<string, DbReviewWinner>
}>({
  generate: async () => {
    const updatedReviewWinners = await new ReviewWinnersRepo().getAllReviewWinnersWithPosts();
    return {
      reviewWinners: updatedReviewWinners,
      reviewWinnersByPostId: mapValues(
        keyBy(updatedReviewWinners, p => p._id),
        p => p.reviewWinner
      )
    };
  },
  expiryMs: 60*60*1000, //1 hour
});

export async function getPostReviewWinnerInfo(postId: string, context: ResolverContext): Promise<DbReviewWinner | null> {
  const { reviewWinnersByPostId } = await reviewWinnerCache.get();
  return reviewWinnersByPostId[postId]
    ?? await context.ReviewWinners.findOne({ postId, reviewYear: {$lte: BEST_OF_LESSWRONG_PUBLISH_YEAR} });
}
