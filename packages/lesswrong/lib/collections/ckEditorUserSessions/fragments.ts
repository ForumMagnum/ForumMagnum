import { frag } from "@/lib/fragments/fragmentWrapper";

export const CkEditorUserSessionInfo = () => frag`
  fragment CkEditorUserSessionInfo on CkEditorUserSession {
    _id
    userId
    documentId
    endedAt
    endedBy
  }
`
