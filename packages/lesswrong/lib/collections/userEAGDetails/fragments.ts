import { gql } from "@/lib/generated/gql-codegen/gql";

export const UserEAGDetailsMinimumInfo = () => gql(`
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
`)
