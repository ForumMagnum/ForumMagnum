import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment CkEditorUserSessionInfo on CkEditorUserSession {
    _id
    userId
    documentId
    endedAt
    endedBy
  }
`);
