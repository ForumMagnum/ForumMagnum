import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

interface PostReviewWinnersViewTerms extends ViewTermsBase {
  view?: 'reviewWinnerSingle';
  reviewYear?: number;
  reviewRanking?: number;
  category?: string;
}

declare global {
  type ReviewWinnersViewTerms = PostReviewWinnersViewTerms;
}

function reviewWinnerSingle(terms: PostReviewWinnersViewTerms) {
  return {
    selector: {
      category: terms.category,
      reviewYear: terms.reviewYear,
      reviewRanking: terms.reviewRanking
    }
  };
}

export const ReviewWinnersViews = new CollectionViewSet('ReviewWinners', {
  reviewWinnerSingle
});
