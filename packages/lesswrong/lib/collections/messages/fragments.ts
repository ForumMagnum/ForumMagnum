import { gql } from "@/lib/crud/wrapGql";

export const messageListFragment = gql(`
  fragment messageListFragment on Message {
    _id
    user {
      ...UsersMinimumInfo
      profileImageId
    }
    contents {
      html
      plaintextMainText
    }
    createdAt
    conversationId
  }
`)
