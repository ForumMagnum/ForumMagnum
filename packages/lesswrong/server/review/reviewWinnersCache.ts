import { BEST_OF_LESSWRONG_PUBLISH_YEAR } from "@/lib/reviewUtils";
import { SwrCache } from "@/lib/utils/swrCache";
import keyBy from "lodash/keyBy";
import mapValues from "lodash/mapValues";

export type ReviewWinnerWithPost = DbPost & { reviewWinner: DbReviewWinner & { reviewWinnerArt: DbReviewWinnerArt } };

export const reviewWinnerCache = new SwrCache<{
  reviewWinners: ReviewWinnerWithPost[],
  reviewWinnersByPostId: Record<string, DbReviewWinner>
}, [ResolverContext]>({
  generate: async (context) => {
    const { repos } = context;
    const updatedReviewWinners = await repos.reviewWinners.getAllReviewWinnersWithPosts();
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
  const { reviewWinnersByPostId } = await reviewWinnerCache.get(context);
  return reviewWinnersByPostId[postId]
    ?? await context.ReviewWinners.findOne({ postId, reviewYear: {$lte: BEST_OF_LESSWRONG_PUBLISH_YEAR} });
}
