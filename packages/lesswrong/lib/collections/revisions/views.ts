import { Revisions } from './collection';
import { ensureIndex } from '../../collectionUtils';

declare global {
  interface RevisionsViewTerms extends ViewTermsBase {
    view?: RevisionsViewName
    documentId?: string
    fieldName?: string
    before?: Date|string|null,
    after?: Date|string|null,
  }
}

Revisions.addView('revisionsOnDocument', (terms: RevisionsViewTerms) => {
  const result = {
    selector: {
      documentId: terms.documentId,
      fieldName: terms.fieldName,
      ...((terms.before||terms.after) && {
        editedAt: {
          ...(terms.before && {$lt: terms.before}),
          ...(terms.after && {$gt: terms.after}),
        }
      })
    },
    options: {
      sort: {
        editedAt: -1,
      }
    }
  }
  return result;
});

ensureIndex(Revisions, {collectionName:1, fieldName:1, editedAt:1, changeMetrics:1});
