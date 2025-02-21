import { elasticSyncDocument } from '../search/elastic/elasticCallbacks';
import { getCollectionHooks } from '../mutationCallbacks';

function reindexParentTagIfNeeded(multiDoc: DbMultiDocument) {
  if (multiDoc.collectionName === 'Tags' && multiDoc.fieldName === 'description') {
    void elasticSyncDocument('Tags', multiDoc.parentDocumentId);
  }
}

getCollectionHooks('MultiDocuments').createAsync.add(async ({ document }) => {
  reindexParentTagIfNeeded(document);
});

getCollectionHooks('MultiDocuments').editAsync.add(async (newDoc/*, oldDoc*/) => {
  reindexParentTagIfNeeded(newDoc);
});
