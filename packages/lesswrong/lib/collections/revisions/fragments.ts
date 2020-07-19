import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment RevisionMetadata on Revision {
    _id
    version
    editedAt
    commitMessage
    userId
  }
`);

registerFragment(`
  fragment RevisionMetadataWithChangeMetrics on Revision {
    ...RevisionMetadata
    changeMetrics
  }
`);
