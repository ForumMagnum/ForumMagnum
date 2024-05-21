import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CkEditorUserSessionInfo on CkEditorUserSession {
    _id
    userId
    documentId
    endedAt
    endedBy
  }
`);
