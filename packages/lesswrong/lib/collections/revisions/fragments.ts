import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment RevisionMetadata on Revision {
    version
    editedAt
    commitMessage
    userId
  }
`);
