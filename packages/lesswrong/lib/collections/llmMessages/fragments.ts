import { frag } from "@/lib/fragments/fragmentWrapper";

export const LlmMessagesFragment = () => frag`
  fragment LlmMessagesFragment on LlmMessage {
    _id
    userId
    conversationId
    role
    content
    createdAt
  }
`
