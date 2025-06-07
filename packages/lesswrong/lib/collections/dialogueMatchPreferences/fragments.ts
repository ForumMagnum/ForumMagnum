import { gql } from "@/lib/crud/wrapGql";

export const DialogueMatchPreferenceInfo = gql(`
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
`)
