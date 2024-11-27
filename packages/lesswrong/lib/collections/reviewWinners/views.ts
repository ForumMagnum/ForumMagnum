import ReviewWinners from "./collection";


interface PostReviewWinnersViewTerms extends ViewTermsBase {
  view: 'reviewWinners';
  reviewYear: number;
  reviewRanking: number;
  category: string;
}

declare global {
  type ReviewWinnersViewTerms = PostReviewWinnersViewTerms;
}

ReviewWinners.addView('reviewWinners', (terms: PostReviewWinnersViewTerms) => {
  return {
    selector: {
      category: terms.category,
      reviewYear: terms.reviewYear,
      reviewRanking: terms.reviewRanking
    }
  };
});
