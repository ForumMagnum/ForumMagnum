import { frag } from "@/lib/fragments/fragmentWrapper"

export const RevisionDisplay = () => frag`
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

export const RevisionHTML = () => frag`
  fragment RevisionHTML on Revision {
    _id
    html
  }
`

export const RevisionEdit = () => frag`
  fragment RevisionEdit on Revision {
    ${RevisionDisplay}
    originalContents {
      type
      data
    }
    markdown
    draftJS
    ckEditorMarkup
  }
`

export const RevisionMetadata = () => frag`
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

export const RevisionMetadataWithChangeMetrics = () => frag`
  fragment RevisionMetadataWithChangeMetrics on Revision {
    ...RevisionMetadata
    changeMetrics
    user {
      ...UsersMinimumInfo
    }
  }
`

export const RevisionHistoryEntry = () => frag`
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

export const RevisionHistorySummaryEdit = () => frag`
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

export const RevisionTagFragment = () => frag`
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

export const RecentDiscussionRevisionTagFragment = () => frag`
  fragment RecentDiscussionRevisionTagFragment on Revision {
    ...RevisionHistoryEntry
    tag {
      ...TagRecentDiscussion
    }
  }
`

export const WithVoteRevision = () => frag`
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
