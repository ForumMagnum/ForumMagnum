import {ensureIndex} from '../../collectionIndexUtils';
import { DialogueMatchPreferences } from './collection';

declare global {
  interface DialogueMatchPreferencesViewTerms extends ViewTermsBase {
    view?: DialogueMatchPreferencesViewName,
    dialogueCheckId?: string,
  }
}

DialogueMatchPreferences.addView('dialogueMatchPreferences', (terms: DialogueMatchPreferencesViewTerms) => {
  return {
    selector: {
        dialogueCheckId: terms.dialogueCheckId,
    },
  };
});

ensureIndex(DialogueMatchPreferences, { dialogueCheckId: 1 }, { unique: true });
