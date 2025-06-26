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
  year: number;
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

// Note, this is grabbing reviewWinnerArts based on their createdAt,
// not by their reviewYear (because they don't automatically have access
// to reviewYear)
function allForYear({year}: AllForYearViewTerms) {
  return {
    selector: {
      createdAt: {
        $gte: new Date(year, 0, 1), // January 1st of current year
        $lt: new Date(year + 1, 0, 1) // January 1st of next year
      }
    }
  };
}

export const ReviewWinnerArtsViews = new CollectionViewSet('ReviewWinnerArts', {
  postArt,
  allForYear
});

