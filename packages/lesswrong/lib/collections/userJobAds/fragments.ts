import { gql } from "@/lib/crud/wrapGql";

export const UserJobAdsMinimumInfo = gql(`
  fragment UserJobAdsMinimumInfo on UserJobAd {
    _id
    userId
    createdAt
    lastUpdated
    jobName
    adState
    reminderSetAt
  }
`)
