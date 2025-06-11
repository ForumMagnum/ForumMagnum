import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface DialogueMatchPreferencesViewTerms extends ViewTermsBase {
    view: DialogueMatchPreferencesViewName,
    dialogueCheckId?: string,
  }
}

function dialogueMatchPreferences(terms: DialogueMatchPreferencesViewTerms) {
  return {
    selector: {
        dialogueCheckId: terms.dialogueCheckId,
        deleted: {$ne: true},
    },
  };
}

export const DialogueMatchPreferencesViews = new CollectionViewSet('DialogueMatchPreferences', {
  dialogueMatchPreferences
});
