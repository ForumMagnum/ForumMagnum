import { registerFragment } from '../../vulcan-lib';

registerFragment(`
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
`);
