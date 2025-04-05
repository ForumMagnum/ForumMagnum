import { frag } from "@/lib/fragments/fragmentWrapper"

export const UserRateLimitDisplay = () => frag`
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
`
