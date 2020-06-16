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
