export const PROBABILITY_REVIEW_WINNER_THRESHOLD = 0.5

export const MINIMUM_KARMA_REVIEW_MARKET_CREATION = 100;

export type AnnualReviewMarketInfo = {
  probability: number;
  isResolved: boolean;
  year: number;
}

export const getMarketInfo = (post: PostsBase): AnnualReviewMarketInfo | null => {
  if (post.annualReviewMarketProbability == null) return null
  if (post.annualReviewMarketIsResolved == null) return null
  if (post.annualReviewMarketYear == null) return null
  return {
    probability: post.annualReviewMarketProbability,
    isResolved: post.annualReviewMarketIsResolved,
    year: post.annualReviewMarketYear
  }
}

export const highlightMarket = (info : AnnualReviewMarketInfo | null) : boolean =>
  !!info && !info.isResolved && info.probability > PROBABILITY_REVIEW_WINNER_THRESHOLD
