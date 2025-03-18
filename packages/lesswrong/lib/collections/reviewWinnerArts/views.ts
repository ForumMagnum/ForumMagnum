import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

interface NoViewTerms extends ViewTermsBase {
  view?: undefined;
}

interface PostReviewWinnerArtsViewTerms extends ViewTermsBase {
  view: 'postArt';
  postId: string;
}

interface AllForYearViewTerms extends ViewTermsBase {
  view: 'allForYear';
}

declare global {
  type ReviewWinnerArtsViewTerms =
    | NoViewTerms
    | PostReviewWinnerArtsViewTerms
    | AllForYearViewTerms;
}

function postArt(terms: PostReviewWinnerArtsViewTerms) {
  return {
    selector: {
      postId: terms.postId
    }
  };
}

function allForYear() {
  return {
    selector: {
      createdAt: {
        $gte: new Date(new Date().getFullYear(), 0, 1) // January 1st of currepnt year
      }
    }
  };
}

export const ReviewWinnerArtsViews = new CollectionViewSet('ReviewWinnerArts', {
  postArt,
  allForYear
});

