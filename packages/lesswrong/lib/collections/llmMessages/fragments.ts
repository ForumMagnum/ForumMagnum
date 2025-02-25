import { registerFragment } from "@/lib/vulcan-lib/fragments.ts";

registerFragment(`
  fragment LlmMessagesFragment on LlmMessage {
    _id
    userId
    conversationId
    role
    content
    createdAt
  }
`);
