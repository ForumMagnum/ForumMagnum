import { gql } from "@/lib/crud/wrapGql";

export const SubscriptionState = gql(`
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
`)

export const MembersOfGroupFragment = gql(`
  fragment MembersOfGroupFragment on Subscription {
    user {
      ...UsersMinimumInfo
    }
  }
`)
