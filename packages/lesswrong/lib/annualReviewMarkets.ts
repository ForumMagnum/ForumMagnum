export const PROBABILITY_REVIEW_WINNER_THRESHOLD = 0.5

export const MINIMUM_KARMA_REVIEW_MARKET_CREATION = 100;

export type AnnualReviewMarketInfo = {
  probability: number;
  isResolved: boolean;
  year: number;
}

export const getMarketInfo = (post: PostsBase): AnnualReviewMarketInfo | undefined => {
  if (typeof post.annualReviewMarketProbability !== 'number') return undefined
  if (typeof post.annualReviewMarketIsResolved !== 'boolean') return undefined
  if (typeof post.annualReviewMarketYear !== 'number') return undefined
  return {
    probability: post.annualReviewMarketProbability,
    isResolved: post.annualReviewMarketIsResolved,
    year: post.annualReviewMarketYear
  }
}

export const highlightMarket = (info: AnnualReviewMarketInfo | undefined): boolean =>
  !!info && !info.isResolved && info.probability > PROBABILITY_REVIEW_WINNER_THRESHOLD
