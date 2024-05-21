import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment UserJobAdsMinimumInfo on UserJobAd {
    _id
    userId
    createdAt
    lastUpdated
    jobName
    adState
    reminderSetAt
  }
`);
