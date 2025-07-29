import { elasticSyncDocument } from '../search/elastic/elasticCallbacks';
import { backgroundTask } from '../utils/backgroundTask';

export function reindexParentTagIfNeeded(multiDoc: DbMultiDocument) {
  if (multiDoc.collectionName === 'Tags' && multiDoc.fieldName === 'description') {
    backgroundTask(elasticSyncDocument('Tags', multiDoc.parentDocumentId));
  }
}
