import { gql } from "@/lib/crud/wrapGql";

export const AdvisorRequestsMinimumInfo = gql(`
  fragment AdvisorRequestsMinimumInfo on AdvisorRequest {
    _id
    userId
    createdAt
    interestedInMetaculus
    jobAds
  }
`)
