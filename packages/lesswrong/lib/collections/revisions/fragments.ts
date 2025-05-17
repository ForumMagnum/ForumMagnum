import { gql } from "@/lib/generated/gql-codegen/gql";

export const RevisionDisplay = gql(`
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

export const RevisionHTML = gql(`
  fragment RevisionHTML on Revision {
    _id
    html
  }
`)

export const RevisionEdit = gql(`
  fragment RevisionEdit on Revision {
    ...RevisionDisplay
    originalContents {
      type
      data
    }
    markdown
    ckEditorMarkup
  }
`)

export const RevisionMetadata = gql(`
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
`)

export const RevisionMetadataWithChangeMetrics = gql(`
  fragment RevisionMetadataWithChangeMetrics on Revision {
    ...RevisionMetadata
    changeMetrics
    user {
      ...UsersMinimumInfo
    }
  }
`)

export const RevisionHistoryEntry = gql(`
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
`)

export const RevisionHistorySummaryEdit = gql(`
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
`)

export const RevisionTagFragment = gql(`
  fragment RevisionTagFragment on Revision {
    ...RevisionHistoryEntry
    tag {
      ...TagHistoryFragment
    }
    lens {
      ...MultiDocumentParentDocument
    }
  }
`)

export const RecentDiscussionRevisionTagFragment = gql(`
  fragment RecentDiscussionRevisionTagFragment on Revision {
    ...RevisionHistoryEntry
    tag {
      ...TagRecentDiscussion
    }
  }
`)

export const WithVoteRevision = gql(`
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
`)
