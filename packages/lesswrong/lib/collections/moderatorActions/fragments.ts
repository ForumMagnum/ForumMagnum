import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ModeratorActionDisplay on ModeratorAction {
    user {
      displayName
    }
    userId
    type
    active
    createdAt
    endedAt
  }
`);
