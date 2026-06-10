import { compareReviewMarketProbability } from "../components/review/reviewVotingSort";

describe("compareReviewMarketProbability", () => {
  it("sorts posts with higher Manifold probability first", () => {
    const posts = [
      { annualReviewMarketProbability: 0.25 },
      { annualReviewMarketProbability: 0.8 },
      { annualReviewMarketProbability: 0.5 },
    ];

    expect([...posts].sort(compareReviewMarketProbability)).toEqual([
      { annualReviewMarketProbability: 0.8 },
      { annualReviewMarketProbability: 0.5 },
      { annualReviewMarketProbability: 0.25 },
    ]);
  });

  it("sorts missing Manifold probabilities after known probabilities", () => {
    const posts = [
      { annualReviewMarketProbability: null },
      { annualReviewMarketProbability: 0.1 },
      {},
    ];

    expect([...posts].sort(compareReviewMarketProbability)).toEqual([
      { annualReviewMarketProbability: 0.1 },
      { annualReviewMarketProbability: null },
      {},
    ]);
  });
});
