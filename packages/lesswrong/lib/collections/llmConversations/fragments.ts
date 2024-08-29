import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment LlmConversationsFragment on LlmConversation {
    _id
    userId
    title
    createdAt
    lastUpdatedAt
    deleted
  }
`);

registerFragment(`
  fragment LlmConversationsWithUserInfoFragment on LlmConversation {
    ...LlmConversationsFragment
    user {
      ...UsersMinimumInfo
    }
  }
`)


registerFragment(`
  fragment LlmConversationsWithMessagesFragment on LlmConversation {
    ...LlmConversationsFragment
    messages {
      ...LlmMessagesFragment
    }
  }
`);
