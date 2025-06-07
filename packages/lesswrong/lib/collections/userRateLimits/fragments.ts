import { gql } from "@/lib/crud/wrapGql";

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
