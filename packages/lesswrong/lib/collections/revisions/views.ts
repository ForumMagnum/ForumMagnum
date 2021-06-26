import { Revisions } from './collection';
import { ensureIndex, ensurePgIndex } from '../../collectionUtils';

declare global {
  interface RevisionsViewTerms extends ViewTermsBase {
    view?: RevisionsViewName
    documentId?: string
    fieldName?: string
    before?: Date|string|null,
    after?: Date|string|null,
    userId?: string
  }
}

Revisions.addView('revisionsByUser', (terms: RevisionsViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      collectionName: 'Tags'
    },
    options: {sort: {editedAt: -1}},
  }
});
ensureIndex(Revisions, {userId: 1, editedAt: 1});

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

ensurePgIndex(Revisions, "editedAt", "USING BTREE ((json->>'collectionName'), (json->>'fieldName'), (json->>'editedAt'), (json->'changeMetrics'))");
