import { frag } from "@/lib/fragments/fragmentWrapper";

export const messageListFragment = () => frag`
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
`
