import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment LlmConversationsFragment on LlmConversation {
    _id
    userId
    title
    model
    systemPrompt
    createdAt
    lastUpdatedAt
  }
`);

registerFragment(`
  fragment LlmConversationsWithMessagesFragment on LlmConversation {
    ...LlmConversationsFragment
    messages {
      ...LlmMessagesFragment
    }
  }
`);
