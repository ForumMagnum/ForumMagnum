import { gql } from "@/lib/generated/gql-codegen";

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
