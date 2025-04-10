import { gql } from "@/lib/generated/gql-codegen/gql";

export const DialogueCheckInfo = gql(`
  fragment DialogueCheckInfo on DialogueCheck {
    _id
    userId
    targetUserId
    checked
    checkedAt
    hideInRecommendations
    matchPreference {
      ...DialogueMatchPreferenceInfo
    }
    reciprocalMatchPreference {
      ...DialogueMatchPreferenceInfo
    }
  }
`)
