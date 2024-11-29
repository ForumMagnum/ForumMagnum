import ReviewWinners from "./collection";


interface PostReviewWinnersViewTerms extends ViewTermsBase {
  view?: 'reviewWinnerSingle';
  reviewYear?: number;
  reviewRanking?: number;
  category?: string;
}

declare global {
  type ReviewWinnersViewTerms = PostReviewWinnersViewTerms;
}

ReviewWinners.addView('reviewWinnerSingle', (terms: PostReviewWinnersViewTerms) => {
  return {
    selector: {
      category: terms.category,
      reviewYear: terms.reviewYear,
      reviewRanking: terms.reviewRanking
    }
  };
});
