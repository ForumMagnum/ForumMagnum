import { SwrCache } from "@/lib/utils/swrCache";
import keyBy from "lodash/keyBy";
import { unstable_cache } from "next/cache";
import ReviewWinnersRepo from "../repos/ReviewWinnersRepo";

const getCachedReviewWinners = unstable_cache(
  () => new ReviewWinnersRepo().getAllReviewWinnerPosts(),
  // Invalidate on deploys in case there's a backwards-breaking change to the schema, such that returning cached post items might break the api
  [process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'dev'],
  { revalidate: 60 * 90 }
);

export const reviewWinnerPostsCache = new SwrCache<{
  reviewWinners: DbPost[],
}, []>({
  generate: async () => {
    const updatedReviewWinners = await getCachedReviewWinners();
    return {
      reviewWinners: updatedReviewWinners,
    };
  },
  expiryMs: 60*60*1000, //1 hour
});

const reviewWinnerCache = new SwrCache<{
  reviewWinnersByPostId: Record<string, DbReviewWinner>
}, [ResolverContext]>({
  generate: async (context) => {
    const updatedReviewWinners = await context.ReviewWinners.find({}).fetch();
    return {
      reviewWinnersByPostId: keyBy(updatedReviewWinners, rw => rw.postId),
    };
  },
  expiryMs: 60*60*1000, //1 hour
});

export async function getPostReviewWinnerInfo(postId: string, context: ResolverContext): Promise<DbReviewWinner | null> {
  const { reviewWinnersByPostId } = await reviewWinnerCache.get(context);
  return reviewWinnersByPostId[postId];
}
