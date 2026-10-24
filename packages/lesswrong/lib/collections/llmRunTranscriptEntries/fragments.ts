import { gql } from "@/lib/generated/gql-codegen";

export const LlmRunTranscriptEntryFragment = gql(`
  fragment LlmRunTranscriptEntryFragment on LlmRunTranscriptEntry {
    _id
    type
    text
    toolCallId
    toolName
    query
    url
    title
    extra
  }
`);
