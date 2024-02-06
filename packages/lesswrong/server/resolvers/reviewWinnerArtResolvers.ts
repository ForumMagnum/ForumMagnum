import moment from "moment";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import { defineMutation, defineQuery } from "../utils/serverGraphqlUtil";
import { onStartup } from "../../lib/executionEnvironment";
import { createAnonymousContext } from "../vulcan-lib";
import type { ReviewWinnerArtWithPost } from "../repos/ReviewWinnerArtsRepo";

interface ReviewWinnerArtCache {
  reviewWinnerArt: ReviewWinnerArtWithPost[];
  lastUpdatedAt: Date;
}

const REVIEW_WINNER_ART_CACHE: ReviewWinnerArtCache = {
  reviewWinnerArt: [],
  lastUpdatedAt: new Date()
};

async function updateReviewWinnerArtCache(context: ResolverContext) {
  const updatedReviewWinnerArt: ReviewWinnerArtWithPost[] = await context.repos.reviewWinnerArts.getAllReviewWinnerArtWithPosts();
  REVIEW_WINNER_ART_CACHE.reviewWinnerArt = updatedReviewWinnerArt;
  REVIEW_WINNER_ART_CACHE.lastUpdatedAt = new Date();
}

onStartup(async () => {
  await updateReviewWinnerArtCache(createAnonymousContext());
});

defineQuery({
  name: 'GetAllReviewWinnerArt',
  schema: `
    type ReviewWinnerArtWithPost {
      reviewWinner: ReviewWinnerArt!
      post: Post!
    }
  `,
  resultType: '[ReviewWinnerArtWithPost!]!',
  fn: async (root, args, context) => {
    const { currentUser } = context;

    if (!userIsAdminOrMod(currentUser)) {
      throw new Error('Only admins may fetch all review winner art using this API!');
    }

    const cacheStale = moment(REVIEW_WINNER_ART_CACHE.lastUpdatedAt).isBefore(moment(new Date()).subtract(1, 'hour'));
    if (cacheStale) {
      await updateReviewWinnerArtCache(context);
    }

    return REVIEW_WINNER_ART_CACHE.reviewWinnerArt;
  }
})

defineMutation({
  name: 'UpdateReviewWinnerArtOrder',
  resultType: '[ReviewWinnerArtWithPost!]!',
  argTypes: '(reviewWinnerArtId: String!, newCuratedOrder: Int!)',
  fn: async (_, { reviewWinnerArtId, newCuratedOrder }: { reviewWinnerArtId: string, newCuratedOrder: number }, context) => {
    const { currentUser } = context;

    if (!userIsAdminOrMod(currentUser)) {
      throw new Error('Only admins may update review winner art ordering!');
    }

    await context.repos.reviewWinners.updateCuratedOrder(reviewWinnerArtId, newCuratedOrder);
    await updateReviewWinnerArtCache(context);

    return REVIEW_WINNER_ART_CACHE.reviewWinnerArt;
  }
});
