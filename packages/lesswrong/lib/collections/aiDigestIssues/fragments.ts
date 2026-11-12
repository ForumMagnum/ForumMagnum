import { gql } from "@/lib/generated/gql-codegen";

export const AiDigestIssuesList = gql(`
  fragment AiDigestIssuesList on AiDigestIssue {
    _id
    subject
    createdAt
    trigger
    countsTowardHistory
  }
`);

export const AiDigestIssuesContent = gql(`
  fragment AiDigestIssuesContent on AiDigestIssue {
    ...AiDigestIssuesList
    spec
  }
`);
