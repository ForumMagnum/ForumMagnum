import { frag } from "@/lib/fragments/fragmentWrapper"

export const UserJobAdsMinimumInfo = () => gql`
  fragment UserJobAdsMinimumInfo on UserJobAd {
    _id
    userId
    createdAt
    lastUpdated
    jobName
    adState
    reminderSetAt
  }
`
