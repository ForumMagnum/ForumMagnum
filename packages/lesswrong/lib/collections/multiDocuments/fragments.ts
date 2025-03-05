export const MultiDocumentMinimumInfo = `
  fragment MultiDocumentMinimumInfo on MultiDocument {
    _id
    parentDocumentId
    collectionName
    fieldName
    userId
    slug
    oldSlugs
    title
    tabTitle
    tabSubtitle
    preview
    index
    deleted
    createdAt
    legacyData

    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    voteCount
    currentUserVote
    currentUserExtendedVote
  }
`

export const MultiDocumentContentDisplay = `
  fragment MultiDocumentContentDisplay on MultiDocument {
    ...MultiDocumentMinimumInfo
    tableOfContents
    textLastUpdatedAt
    contents {
      ...RevisionEdit
    }
  }
`

export const MultiDocumentEdit = `
  fragment MultiDocumentEdit on MultiDocument {
    ...MultiDocumentContentDisplay
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
    summaries {
      ...MultiDocumentContentDisplay
    }
    textLastUpdatedAt
  }
`

export const MultiDocumentParentDocument = `
  fragment MultiDocumentParentDocument on MultiDocument {
    ...MultiDocumentEdit
    parentTag {
      ...TagHistoryFragment
    }
  }
`

export const MultiDocumentWithContributors = `
  fragment MultiDocumentWithContributors on MultiDocument {
    ...MultiDocumentEdit
    contributors {
      totalCount
      contributors {
        user {
          ...UsersMinimumInfo
        }
        currentAttributionCharCount
      }
    }
  }
`

export const MultiDocumentRevision = `
  fragment MultiDocumentRevision on MultiDocument {
    ...MultiDocumentMinimumInfo
    contents(version: $version) {
      ...RevisionEdit
    }
    tableOfContents(version: $version)
  }
`

export const MultiDocumentWithContributorsRevision = `
  fragment MultiDocumentWithContributorsRevision on MultiDocument {
    ...MultiDocumentRevision
    contributors(version: $version) {
      totalCount
      contributors {
        user {
          ...UsersMinimumInfo
        }
        currentAttributionCharCount
        contributionScore
      }
    }
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
  }
`

export const WithVoteMultiDocument = `
  fragment WithVoteMultiDocument on MultiDocument {
    ...MultiDocumentMinimumInfo
  }
`
