import moment from "moment";
import { restrictViewableFieldsSingle } from "../../lib/vulcan-users";
import { defineQuery } from "../utils/serverGraphqlUtil";
import { onStartup } from "../../lib/executionEnvironment";
import { createAnonymousContext } from "../vulcan-lib";
import type { ReviewWinnerWithPost } from "../repos/ReviewWinnersRepo";
import Posts from "../../lib/collections/posts/collection";

interface ReviewWinnerCache {
  reviewWinners: ReviewWinnerWithPost[];
  lastUpdatedAt: Date;
}

const REVIEW_WINNER_CACHE: ReviewWinnerCache = {
  reviewWinners: [],
  lastUpdatedAt: new Date()
};

async function updateReviewWinnerCache(context: ResolverContext) {
  const updatedReviewWinners = await context.repos.reviewWinners.getAllReviewWinnersWithPosts();
  REVIEW_WINNER_CACHE.reviewWinners = updatedReviewWinners;
  REVIEW_WINNER_CACHE.lastUpdatedAt = new Date();
}

onStartup(async () => {
  await updateReviewWinnerCache(createAnonymousContext());
});

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
