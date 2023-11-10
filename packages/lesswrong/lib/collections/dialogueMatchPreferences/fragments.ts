import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment DialogueMatchPreferenceInfo on DialogueMatchPreference {
    _id
    dialogueCheckId
    topicNotes
    syncPreference
    asyncPreference
    formatNotes
    generatedDialogueId
  }
`);
