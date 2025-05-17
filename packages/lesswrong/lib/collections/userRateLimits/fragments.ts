import { gql } from "@/lib/generated/gql-codegen/gql";

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
