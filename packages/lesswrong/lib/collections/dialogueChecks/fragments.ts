import { frag } from "@/lib/fragments/fragmentWrapper";

export const DialogueCheckInfo = () => gql`
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
`
