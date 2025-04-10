import { elasticSyncDocument } from '../search/elastic/elasticCallbacks';

export function reindexParentTagIfNeeded(multiDoc: DbMultiDocument) {
  if (multiDoc.collectionName === 'Tags' && multiDoc.fieldName === 'description') {
    void elasticSyncDocument('Tags', multiDoc.parentDocumentId);
  }
}
