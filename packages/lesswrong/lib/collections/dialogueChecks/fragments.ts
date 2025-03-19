export const DialogueCheckInfo = `
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
