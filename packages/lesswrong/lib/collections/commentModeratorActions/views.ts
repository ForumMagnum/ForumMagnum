import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

interface NoViewTerms extends ViewTermsBase {
  view: undefined;
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

function activeCommentModeratorActions(terms: ActiveCommentModeratorActionsViewTerms) {
  return {
    selector: {
      $or: [
        { endedAt: { $exists: false } },
        { endedAt: null }
      ]
    },
    options: { sort: { createdAt: -1 }, limit: terms.limit }
  };
}

export const CommentModeratorActionsViews = new CollectionViewSet('CommentModeratorActions', {
  activeCommentModeratorActions
});
