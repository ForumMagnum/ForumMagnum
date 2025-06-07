import { gql } from "@/lib/crud/wrapGql";

export const CkEditorUserSessionInfo = gql(`
  fragment CkEditorUserSessionInfo on CkEditorUserSession {
    _id
    userId
    documentId
    endedAt
    endedBy
  }
`)
