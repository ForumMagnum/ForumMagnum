import { gql } from "@/lib/generated/gql-codegen";

export const AiDigestIssuesList = gql(`
  fragment AiDigestIssuesList on AiDigestIssue {
    _id
    subject
    generatedAt
    trigger
    countsTowardHistory
    personalInstructions
  }
`);

export const AiDigestIssuesAdminList = gql(`
  fragment AiDigestIssuesAdminList on AiDigestIssue {
    ...AiDigestIssuesList
    selectionModelId
  }
`);

export const AiDigestIssuesContent = gql(`
  fragment AiDigestIssuesContent on AiDigestIssue {
    ...AiDigestIssuesList
    spec
  }
`);
