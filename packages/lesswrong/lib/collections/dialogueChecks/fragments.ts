import { frag } from "@/lib/fragments/fragmentWrapper";

export const DialogueCheckInfo = () => frag`
  fragment DialogueCheckInfo on DialogueCheck {
    _id
    userId
    targetUserId
    checked
    checkedAt
    hideInRecommendations
    matchPreference {
      ...DialogueMatchPreferencesDefaultFragment
    }
    reciprocalMatchPreference {
      ...DialogueMatchPreferencesDefaultFragment
    }
  }
`
