import ReviewWinnerArts from "./collection";

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

ReviewWinnerArts.addView('postArt', (terms: PostReviewWinnerArtsViewTerms) => {
  return {
    selector: {
      postId: terms.postId
    }
  };
});
