export interface ReviewVotingSortPostWithMarketProbability {
  annualReviewMarketProbability?: number | null
}

const missingMarketProbabilitySortValue = -1;

export const compareReviewMarketProbability = (
  post1: ReviewVotingSortPostWithMarketProbability,
  post2: ReviewVotingSortPostWithMarketProbability,
): number => {
  const post1Probability = post1.annualReviewMarketProbability ?? missingMarketProbabilitySortValue;
  const post2Probability = post2.annualReviewMarketProbability ?? missingMarketProbabilitySortValue;

  if (post1Probability > post2Probability) return -1;
  if (post1Probability < post2Probability) return 1;
  return 0;
};
