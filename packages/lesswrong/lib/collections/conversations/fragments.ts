import { gql } from "@/lib/generated/gql-codegen";

export const ConversationsMinimumInfo = gql(`
  fragment ConversationsMinimumInfo on Conversation {
    _id
    createdAt
    latestActivity
    title
    participantIds
    archivedByIds
    messageCount
    moderator
  }
`)

export const ConversationsList = gql(`
  fragment ConversationsList on Conversation {
    ...ConversationsMinimumInfo
    participants {
      ...UsersMinimumInfo
    }
    latestMessage {
      ...messageListFragment
    }
  }
`)

export const ConversationsListWithReadStatus = gql(`
  fragment ConversationsListWithReadStatus on Conversation {
    ...ConversationsList
    hasUnreadMessages
  }
`)
