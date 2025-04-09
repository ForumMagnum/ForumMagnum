import { gql } from "@/lib/generated/gql-codegen/gql";

export const messageListFragment = () => gql(`
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
