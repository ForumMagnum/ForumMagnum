import { frag } from "@/lib/fragments/fragmentWrapper"

export const ConversationsMinimumInfo = () => frag`
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
`

export const ConversationsList = () => frag`
  fragment ConversationsList on Conversation {
    ...ConversationsMinimumInfo
    participants {
      ...UsersMinimumInfo
    }
    latestMessage {
      ...messageListFragment
    }
  }
`

export const ConversationsListWithReadStatus = () => frag`
  fragment ConversationsListWithReadStatus on Conversation {
    ...ConversationsList
    hasUnreadMessages
  }
`
