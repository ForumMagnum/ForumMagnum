import { REVIEW_YEAR } from '@/lib/reviewUtils';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

interface PostReviewWinnersViewTerms extends ViewTermsBase {
  view?: 'reviewWinnerSingle'|'bestOfLessWrongAnnouncement';
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

function bestOfLessWrongAnnouncement() {
  return {
    selector: {
      reviewYear: REVIEW_YEAR
    },
    options: {
      sort: {
        reviewRanking: 1
      },
      limit: 6
    }
  };
}

export const ReviewWinnersViews = new CollectionViewSet('ReviewWinners', {
  reviewWinnerSingle,
  bestOfLessWrongAnnouncement
});
