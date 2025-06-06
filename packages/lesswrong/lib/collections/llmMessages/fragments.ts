import { gql } from "@/lib/crud/wrapGql";

export const LlmMessagesFragment = gql(`
  fragment LlmMessagesFragment on LlmMessage {
    _id
    userId
    conversationId
    role
    content
    createdAt
  }
`)
