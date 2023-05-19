import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment UserRateLimitDisplay on UserRateLimit {
    _id
    user {
      ...UsersMinimumInfo
    }
    userId
    type
    createdAt
    endedAt
  }
`);
