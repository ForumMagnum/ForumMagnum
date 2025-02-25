import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment BansAdminPageFragment on Ban {
    _id
    createdAt
    expirationDate
    userId
    user {
      ...UsersMinimumInfo
    }
    reason
    comment
    ip
    properties
  }
`);
