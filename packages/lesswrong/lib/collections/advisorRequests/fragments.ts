import { frag } from "@/lib/fragments/fragmentWrapper";

export const AdvisorRequestsMinimumInfo = () => frag`
  fragment AdvisorRequestsMinimumInfo on AdvisorRequest {
    _id
    userId
    createdAt
    interestedInMetaculus
    jobAds
  }
`
