import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment DialogueMatchPreferenceInfo on DialogueMatchPreference {
    _id
    dialogueCheckId
    topicNotes
    topicPreferences
    syncPreference
    asyncPreference
    formatNotes
    generatedDialogueId
    deleted
  }
`);
