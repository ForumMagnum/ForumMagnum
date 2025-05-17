import { gql } from "@/lib/generated/gql-codegen/gql";

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
