export const LlmConversationsFragment = `
  fragment LlmConversationsFragment on LlmConversation {
    _id
    userId
    title
    createdAt
    lastUpdatedAt
    deleted
  }
`

export const LlmConversationsViewingPageFragment = `
  fragment LlmConversationsViewingPageFragment on LlmConversation {
    ...LlmConversationsFragment
    totalCharacterCount
    user {
      ...UsersMinimumInfo
    }
  }
`


export const LlmConversationsWithMessagesFragment = `
  fragment LlmConversationsWithMessagesFragment on LlmConversation {
    ...LlmConversationsFragment
    messages {
      ...LlmMessagesFragment
    }
  }
`
