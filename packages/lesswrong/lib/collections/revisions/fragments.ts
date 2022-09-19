import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment RevisionDisplay on Revision {
    _id
    version
    updateType
    editedAt
    userId
    html
    wordCount
    htmlHighlight
    plaintextDescription
  }
`)



registerFragment(`
  fragment RevisionEdit on Revision {
    _id
    version
    updateType
    editedAt
    userId
    originalContents {
      type
      data
    }
    html
    markdown
    draftJS
    ckEditorMarkup
    wordCount
    htmlHighlight
    plaintextDescription
  }
`)

registerFragment(`
  fragment RevisionMetadata on Revision {
    _id
    version
    editedAt
    commitMessage
    userId
    
    score
    baseScore
    extendedScore
    voteCount
    currentUserVote
    currentUserExtendedVote
  }
`);

registerFragment(`
  fragment RevisionMetadataWithChangeMetrics on Revision {
    ...RevisionMetadata
    changeMetrics
    user {
      ...UsersMinimumInfo
    }
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

registerFragment(`
  fragment WithVoteRevision on Revision {
    __typename
    _id
    currentUserVote
    currentUserExtendedVote
    baseScore
    extendedScore
    score
    voteCount
  }
`);
