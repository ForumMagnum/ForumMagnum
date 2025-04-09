import { frag } from "@/lib/fragments/fragmentWrapper"

export const SubscriptionState = () => gql`
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

export const MembersOfGroupFragment = () => gql`
  fragment MembersOfGroupFragment on Subscription {
    user {
      ...UsersMinimumInfo
    }
  }
`
