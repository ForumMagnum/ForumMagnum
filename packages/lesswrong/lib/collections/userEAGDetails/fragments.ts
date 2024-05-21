import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment UserEAGDetailsMinimumInfo on UserEAGDetail {
    _id
    userId
    createdAt
    lastUpdated
    careerStage
    countryOrRegion
    nearestCity
    willingnessToRelocate
    experiencedIn
    interestedIn
  }
`);
