import { frag } from "@/lib/fragments/fragmentWrapper";

export const DialogueMatchPreferenceInfo = () => frag`
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
`
