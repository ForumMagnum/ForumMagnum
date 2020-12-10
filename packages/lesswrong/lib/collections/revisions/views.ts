import { Revisions } from './collection';
import { ensureIndex } from '../../collectionUtils';

declare global {
  interface RevisionsViewTerms extends ViewTermsBase {
    view?: RevisionsViewName
    documentId?: string
    fieldName?: string
  }
}

Revisions.addView('revisionsOnDocument', (terms: RevisionsViewTerms) => {
  return {
    selector: {
      documentId: terms.documentId,
      fieldName: terms.fieldName,
    },
    options: {
      sort: {
        editedAt: -1,
      }
    }
  }
});

ensureIndex(Revisions, {collectionName:1, fieldName:1, editedAt:1, changeMetrics:1});
