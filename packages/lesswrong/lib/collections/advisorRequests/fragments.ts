import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment AdvisorRequestsMinimumInfo on AdvisorRequest {
    _id
    userId
    createdAt
    interestedInMetaculus
    jobAds
  }
`);
