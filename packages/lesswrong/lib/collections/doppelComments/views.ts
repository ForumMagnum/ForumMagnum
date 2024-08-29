import DoppelComments from './collection';
import { ensureIndex } from '@/lib/collectionIndexUtils';

declare global {
  interface DoppelCommentsForCommentViewTerms {
    view: 'doppelCommentsForComment',
    commentId: string
  }

  type DoppelCommentsViewTerms = Omit<ViewTermsBase, 'view'> & (DoppelCommentsForCommentViewTerms | {
    view?: undefined,
    commentId?: never
  })
}

DoppelComments.addView("doppelCommentsForComment", function (terms: DoppelCommentsForCommentViewTerms) {
  return {
    selector: {
      commentId: terms.commentId,
      deleted: false
    }
  };
});

ensureIndex(DoppelComments, { commentId: 1, deleted: 1, createdAt: 1 });
