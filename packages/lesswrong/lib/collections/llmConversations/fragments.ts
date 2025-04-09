import { frag } from "@/lib/fragments/fragmentWrapper"

export const LlmConversationsFragment = () => gql`
  fragment LlmConversationsFragment on LlmConversation {
    _id
    userId
    title
    createdAt
    lastUpdatedAt
    deleted
  }
`

export const LlmConversationsViewingPageFragment = () => gql`
  fragment LlmConversationsViewingPageFragment on LlmConversation {
    ...LlmConversationsFragment
    totalCharacterCount
    user {
      ...UsersMinimumInfo
    }
  }
`


export const LlmConversationsWithMessagesFragment = () => gql`
  fragment LlmConversationsWithMessagesFragment on LlmConversation {
    ...LlmConversationsFragment
    messages {
      ...LlmMessagesFragment
    }
  }
`
