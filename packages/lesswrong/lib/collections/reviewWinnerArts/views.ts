import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

interface NoViewTerms extends ViewTermsBase {
  view?: undefined;
}

interface PostReviewWinnerArtsViewTerms extends ViewTermsBase {
  view: 'postArt';
  postId: string;
}

declare global {
  type ReviewWinnerArtsViewTerms =
    | NoViewTerms
    | PostReviewWinnerArtsViewTerms;
}

function postArt(terms: PostReviewWinnerArtsViewTerms) {
  return {
    selector: {
      postId: terms.postId
    }
  };
}

export const ReviewWinnerArtsViews = new CollectionViewSet('ReviewWinnerArts', {
  postArt
});
