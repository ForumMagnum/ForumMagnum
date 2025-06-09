import { gql } from "@/lib/generated/gql-codegen";

export const CkEditorUserSessionInfo = gql(`
  fragment CkEditorUserSessionInfo on CkEditorUserSession {
    _id
    userId
    documentId
    endedAt
    endedBy
  }
`)
