import { frag } from "@/lib/fragments/fragmentWrapper";

export const CkEditorUserSessionInfo = () => gql`
  fragment CkEditorUserSessionInfo on CkEditorUserSession {
    _id
    userId
    documentId
    endedAt
    endedBy
  }
`
