export const UserRateLimitDisplay = `
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
