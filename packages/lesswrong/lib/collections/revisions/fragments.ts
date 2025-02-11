import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment RevisionDisplay on Revision {
    _id
    version
    updateType
    editedAt
    userId
    html
    commitMessage
    wordCount
    htmlHighlight
    plaintextDescription
  }
`)

registerFragment(`
  fragment RevisionHTML on Revision {
    _id
    html
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
    collectionName
    changeMetrics
    legacyData
    user {
      ...UsersMinimumInfo
    }
  }
`);

registerFragment(`
  fragment RevisionHistorySummaryEdit on Revision {
    ...RevisionHistoryEntry
    summary {
      ...MultiDocumentMinimumInfo
      parentTag {
        _id name
      }
      parentLens {
        _id title tabTitle tabSubtitle
      }
    }
  }
`);

registerFragment(`
  fragment RevisionTagFragment on Revision {
    ...RevisionHistoryEntry
    tag {
      ...TagHistoryFragment
    }
    lens {
      ...MultiDocumentParentDocument
    }
  }
`);

registerFragment(`
  fragment RecentDiscussionRevisionTagFragment on Revision {
    ...RevisionHistoryEntry
    tag {
      ...TagRecentDiscussion
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
