import CommentModeratorActions from './collection';

interface NoViewTerms extends ViewTermsBase {
  view?: undefined;
}

interface ActiveCommentModeratorActionsViewTerms extends ViewTermsBase {
  view: 'activeCommentModeratorActions';
  limit: number;
}

declare global {
  type CommentModeratorActionsViewTerms =
    | NoViewTerms
    | ActiveCommentModeratorActionsViewTerms
}

CommentModeratorActions.addView('activeCommentModeratorActions', function (terms: ActiveCommentModeratorActionsViewTerms) {
  return {
    selector: {
      $or: [
        { endedAt: { $exists: false } },
        { endedAt: null }
      ]
    },
    options: { sort: { createdAt: -1 }, limit: terms.limit }
  };
})
