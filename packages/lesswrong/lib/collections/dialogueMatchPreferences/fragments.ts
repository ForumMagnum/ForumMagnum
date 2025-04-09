import { frag } from "@/lib/fragments/fragmentWrapper";

export const DialogueMatchPreferenceInfo = () => gql`
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
