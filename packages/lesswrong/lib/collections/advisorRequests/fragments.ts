import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment AdvisorRequestsMinimumInfo on AdvisorRequest {
    _id
    userId
    createdAt
    interestedInMetaculus
    jobAds
  }
`);
