import { gql } from "@/lib/generated/gql-codegen/gql";

export const CkEditorUserSessionInfo = () => gql(`
  fragment CkEditorUserSessionInfo on CkEditorUserSession {
    _id
    userId
    documentId
    endedAt
    endedBy
  }
`)
