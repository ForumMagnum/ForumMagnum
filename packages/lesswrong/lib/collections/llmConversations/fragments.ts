import { frag } from "@/lib/fragments/fragmentWrapper"

export const LlmConversationsFragment = () => frag`
  fragment LlmConversationsFragment on LlmConversation {
    _id
    userId
    title
    createdAt
    lastUpdatedAt
    deleted
  }
`

export const LlmConversationsViewingPageFragment = () => frag`
  fragment LlmConversationsViewingPageFragment on LlmConversation {
    ...LlmConversationsFragment
    totalCharacterCount
    user {
      ...UsersMinimumInfo
    }
  }
`


export const LlmConversationsWithMessagesFragment = () => frag`
  fragment LlmConversationsWithMessagesFragment on LlmConversation {
    ...LlmConversationsFragment
    messages {
      ...LlmMessagesFragment
    }
  }
`
