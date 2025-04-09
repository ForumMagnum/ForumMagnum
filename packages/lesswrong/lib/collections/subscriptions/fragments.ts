import { frag } from "@/lib/fragments/fragmentWrapper"

export const SubscriptionState = () => frag`
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

export const MembersOfGroupFragment = () => frag`
  fragment MembersOfGroupFragment on Subscription {
    user {
      ...UsersMinimumInfo
    }
  }
`
