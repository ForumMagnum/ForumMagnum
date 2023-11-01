import { DialogueChecks } from './collection';

declare global {
  interface DialogueChecksViewTerms extends ViewTermsBase {
    view?: DialogueChecksViewName
    userId?: string
  }
}

DialogueChecks.addView('userDialogueChecks', (terms: DialogueChecksViewTerms) => {
  return {
    selector: {
        userId: terms.userId,
    },
  };
});
