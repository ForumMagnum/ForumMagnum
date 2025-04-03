export const SubscriptionState = `
  fragment SubscriptionState on Subscription {
    _id
    userId
    createdAt
    state
    documentId
    collectionName
    deleted
    type
  }
`

export const MembersOfGroupFragment = `
  fragment MembersOfGroupFragment on Subscription {
    user {
      ...UsersMinimumInfo
    }
  }
`
