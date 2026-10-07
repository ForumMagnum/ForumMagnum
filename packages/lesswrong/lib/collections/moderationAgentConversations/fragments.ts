import { gql } from "@/lib/generated/gql-codegen";

export const ModerationAgentConversationInfo = gql(`
  fragment ModerationAgentConversationInfo on ModerationAgentConversation {
    _id
    createdAt
    userId
    targetUserId
    title
    model
    deleted
  }
`)

export const ModerationAgentConversationWithMessages = gql(`
  fragment ModerationAgentConversationWithMessages on ModerationAgentConversation {
    ...ModerationAgentConversationInfo
    messages
  }
`)
