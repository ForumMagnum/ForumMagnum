import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface RevisionsViewTerms extends ViewTermsBase {
    view: RevisionsViewName
    documentId?: string
    fieldName?: string
    before?: Date|string|null,
    after?: Date|string|null,
    userId?: string
    version?: string
  }
}

// NB: Includes revisions on deleted tags
function revisionsByUser(terms: RevisionsViewTerms) {
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
}

function revisionsOnDocument(terms: RevisionsViewTerms) {
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
}

function revisionByVersionNumber(terms: RevisionsViewTerms) {
  if (!terms.documentId) throw new Error("documentId is required for revisionByVersionNumber");
  if (!terms.version) throw new Error("version is required for revisionByVersionNumber");
  
  return {
    selector: {
      documentId: terms.documentId,
      version: terms.version,
      ...(terms.fieldName && {fieldName: terms.fieldName}),
    },
  };
}

export const RevisionsViews = new CollectionViewSet('Revisions', {
  revisionsByUser,
  revisionsOnDocument,
  revisionByVersionNumber
});
