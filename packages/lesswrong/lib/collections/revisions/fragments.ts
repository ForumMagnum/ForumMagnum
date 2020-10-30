import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment RevisionMetadata on Revision {
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

registerFragment(`
  fragment RevisionHistoryEntry on Revision {
    ...RevisionMetadata
    documentId
    changeMetrics
    user {
      ...UsersMinimumInfo
    }
  }
`);

registerFragment(`
  fragment RevisionTagFragment on Revision {
    ...RevisionHistoryEntry
    tag {
      ...TagBasicInfo
    }
  }
`);
