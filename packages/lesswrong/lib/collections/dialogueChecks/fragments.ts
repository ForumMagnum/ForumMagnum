import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment DialogueCheckInfo on DialogueCheck {
    _id
    userId
    targetUserId
    checked
    checkedAt
    match
    hideInRecommendations
    matchPreference {
      ...DialogueMatchPreferencesDefaultFragment
    }
    reciprocalMatchPreference {
      ...DialogueMatchPreferencesDefaultFragment
    }
  }
`);
