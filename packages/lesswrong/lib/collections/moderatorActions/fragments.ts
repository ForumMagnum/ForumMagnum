import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment ModeratorActionDisplay on ModeratorAction {
    _id
    user {
      ...UsersMinimumInfo
    }
    userId
    type
    active
    createdAt
    endedAt
  }
`);
