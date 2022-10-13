import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ModeratorActionDisplay on ModeratorAction {
    _id
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
