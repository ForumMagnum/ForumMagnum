import { registerFragment } from '../../vulcan-lib/fragments';

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
