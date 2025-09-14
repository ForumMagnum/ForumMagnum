import { SwrCache } from "@/lib/utils/swrCache";
import keyBy from "lodash/keyBy";
import mapValues from "lodash/mapValues";
import ReviewWinnersRepo from "../repos/ReviewWinnersRepo";
import { unstable_cache } from "next/cache";
import { reviewYears, type ReviewYear } from "@/lib/reviewUtils";

export type ReviewWinnerWithPost = DbPost & { reviewWinner: DbReviewWinner & { reviewWinnerArt: DbReviewWinnerArt } };

// Cache the review winners query result in the data cache to
// avoid hammering the database on each deployment when the
// local cache on each instance needs to be repopulated.
// We normally wouldn't bother splitting them up by year,
// but unstable_cache maxes out at storing 2mb per key and
// we're over the limit if we try to cache them all at once.
const getCachedReviewWinners = unstable_cache((reviewYear: ReviewYear) => {
  const reviewWinnersRepo = new ReviewWinnersRepo();
  return reviewWinnersRepo.getAllReviewWinnersWithPosts(reviewYear)
}, undefined, { revalidate: 60 * 60 * 3 }); // 3 hours

export const reviewWinnerCache = new SwrCache<{
  reviewWinners: ReviewWinnerWithPost[],
  reviewWinnersByPostId: Record<string, DbReviewWinner>
}, [ResolverContext]>({
  generate: async (context) => {
    const updatedReviewWinners = (await Promise.all([...reviewYears].map(reviewYear => getCachedReviewWinners(reviewYear)))).flat();
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
  return reviewWinnersByPostId[postId];
}
