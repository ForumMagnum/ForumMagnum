import { gql } from "@/lib/generated/gql-codegen";

export const UserRateLimitMutationFragment = gql(`
  fragment UserRateLimitMutationFragment on UserRateLimit {
    _id
    schemaVersion
    createdAt
    legacyData
    userId
    type
    intervalUnit
    intervalLength
    actionsPerInterval
    endedAt
  }
`);

export const UserRateLimitDisplay = gql(`
  fragment UserRateLimitDisplay on UserRateLimit {
    _id
    user {
      ...UsersMinimumInfo
    }
    userId
    type
    actionsPerInterval
    intervalUnit
    intervalLength
    createdAt
    endedAt
  }
`)
