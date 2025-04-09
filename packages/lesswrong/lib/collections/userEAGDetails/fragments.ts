import { frag } from "@/lib/fragments/fragmentWrapper"

export const UserEAGDetailsMinimumInfo = () => gql`
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
`
