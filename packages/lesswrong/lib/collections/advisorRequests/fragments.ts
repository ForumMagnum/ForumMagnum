import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment AdvisorRequestsMinimumInfo on AdvisorRequest {
    _id
    userId
    createdAt
    timezone
    availability
    questions
    linkedinProfile
    previousExperience
    selectedAdvisors
    referrer
  }
`);
