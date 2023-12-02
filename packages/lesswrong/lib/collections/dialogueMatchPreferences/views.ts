import {ensureIndex} from '../../collectionIndexUtils';
import { DialogueMatchPreferences } from './collection';

type DialogueMatchPreferencesByCheckIdViewTerms = {
  view: "dialogueMatchPreferences",
  dialogueCheckId?: string,
}

type DialogueMatchPreferencesByDialogueViewTerms = {
  view: 'dialogueMatchPreferencesByDialogue',
  generatedDialogueId?: string
}

declare global {
  type DialogueMatchPreferencesViewTerms = ViewTermsBase & ( DialogueMatchPreferencesByCheckIdViewTerms | DialogueMatchPreferencesByDialogueViewTerms ) 
}

DialogueMatchPreferences.addView('dialogueMatchPreferences', (terms: DialogueMatchPreferencesByCheckIdViewTerms) => {
  return {
    selector: {
      dialogueCheckId: terms.dialogueCheckId,
    },
  };
});

ensureIndex(DialogueMatchPreferences, { dialogueCheckId: 1 });

DialogueMatchPreferences.addView('dialogueMatchPreferencesByDialogue', (terms: DialogueMatchPreferencesByDialogueViewTerms) => {
  return {
    selector: {
      generatedDialogueId: terms.generatedDialogueId,
    },
  };
});
