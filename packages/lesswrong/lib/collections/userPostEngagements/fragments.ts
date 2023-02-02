import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ReadingRetrospectivePostEngagement on UserPostEngagement {
    _id
    userId
    referralType
    readingTimeMS
    lastInteractedAt
  }
`);
