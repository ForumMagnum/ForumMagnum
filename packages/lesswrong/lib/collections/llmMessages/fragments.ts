import { registerFragment } from "@/lib/vulcan-lib";

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
