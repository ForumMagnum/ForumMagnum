import { Revisions } from './collection';
import { ensureIndex } from '../../collectionIndexUtils';

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

// NB: Includes revisions on deleted tags
Revisions.addView('revisionsByUser', (terms: RevisionsViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      // TODO: this might cause problems if we're not showing edits to summaries
      // Because we have a limit, if a user has a lot of edits to summaries, we could just show an empty list
      $or: [
        { collectionName: "Tags", fieldName: "description" },
        { collectionName: "MultiDocuments", fieldName: "contents" },
      ]
    },
    options: {sort: {editedAt: -1}},
  }
});
ensureIndex(Revisions, {userId: 1, collectionName: 1, editedAt: 1});

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

ensureIndex(Revisions, {collectionName:1, fieldName:1, editedAt:1, _id: 1, changeMetrics:1});
