import { gql } from "@/lib/generated/gql-codegen";

export const LlmRunPageFragment = gql(`
  fragment LlmRunPageFragment on LlmRun {
    _id
    createdAt
    completedAt
    invocationContext
    status
    modelName
    gatewayModelId
    post {
      _id
      slug
      title
    }
    triggerCommentId
    replyCommentId
    systemPrompt
    contextMessage
    transcriptEntries {
      ...LlmRunTranscriptEntryFragment
    }
    response
    error
  }
`);
