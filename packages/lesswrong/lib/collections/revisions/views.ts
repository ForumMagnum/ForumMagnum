import { Revisions } from './collection';
import { ensureIndex } from '../../collectionUtils';

Revisions.addView('viewsOnDocument', terms => {
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
