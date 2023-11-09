import { DialogueMatchPreferences } from './collection';

declare global {
  interface DialogueMatchPreferencesViewTerms extends ViewTermsBase {
    view?: DialogueMatchPreferencesViewName
    userId?: string
  }
}

DialogueMatchPreferences.addView('userDialogueMatchPreferences', (terms: DialogueMatchPreferencesViewTerms) => {
  return {
    selector: {
        userId: terms.userId,
    },
  };
});
