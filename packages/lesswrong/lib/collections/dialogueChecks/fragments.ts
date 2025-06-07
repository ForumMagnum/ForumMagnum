import { gql } from "@/lib/crud/wrapGql";

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
