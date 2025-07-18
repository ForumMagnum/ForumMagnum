import { gql } from "@/lib/generated/gql-codegen";

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
