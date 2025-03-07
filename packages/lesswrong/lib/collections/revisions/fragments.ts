export const RevisionDisplay = `
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
`

export const RevisionHTML = `
  fragment RevisionHTML on Revision {
    _id
    html
  }
`

export const RevisionEdit = `
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
`

export const RevisionMetadata = `
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
`

export const RevisionMetadataWithChangeMetrics = `
  fragment RevisionMetadataWithChangeMetrics on Revision {
    ...RevisionMetadata
    changeMetrics
    user {
      ...UsersMinimumInfo
    }
  }
`

export const RevisionHistoryEntry = `
  fragment RevisionHistoryEntry on Revision {
    ...RevisionMetadata
    documentId
    collectionName
    changeMetrics
    legacyData
    skipAttributions
    user {
      ...UsersMinimumInfo
    }
  }
`

export const RevisionHistorySummaryEdit = `
  fragment RevisionHistorySummaryEdit on Revision {
    ...RevisionHistoryEntry
    summary {
      ...MultiDocumentMinimumInfo
      parentTag {
        _id
        name
      }
      parentLens {
        _id
        title
        tabTitle
        tabSubtitle
      }
    }
  }
`

export const RevisionTagFragment = `
  fragment RevisionTagFragment on Revision {
    ...RevisionHistoryEntry
    tag {
      ...TagHistoryFragment
    }
    lens {
      ...MultiDocumentParentDocument
    }
  }
`

export const RecentDiscussionRevisionTagFragment = `
  fragment RecentDiscussionRevisionTagFragment on Revision {
    ...RevisionHistoryEntry
    tag {
      ...TagRecentDiscussion
    }
  }
`

export const WithVoteRevision = `
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
`
