import { Revisions } from './collection';

Revisions.addView('revisionsOnDocument', terms => {
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

Revisions.addView('revisionsOnCollection', terms => {
  return {
    selector: {
      collectionName: terms.collectionName,
    },
    options: {
      sort: {
        editedAt: -1,
      }
    }
  }
});
