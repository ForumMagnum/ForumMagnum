import { gql } from "@/lib/generated/gql-codegen";

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
