import { frag } from "@/lib/fragments/fragmentWrapper"

export const MultiDocumentMinimumInfo = () => frag`
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

export const MultiDocumentContentDisplay = () => frag`
  fragment MultiDocumentContentDisplay on MultiDocument {
    ...MultiDocumentMinimumInfo
    tableOfContents
    textLastUpdatedAt
    contents {
      ...RevisionEdit
    }
  }
`

export const MultiDocumentEdit = () => frag`
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

export const MultiDocumentParentDocument = () => frag`
  fragment MultiDocumentParentDocument on MultiDocument {
    ...MultiDocumentEdit
    parentTag {
      ...TagHistoryFragment
    }
  }
`

export const MultiDocumentWithContributors = () => frag`
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

export const MultiDocumentRevision = () => frag`
  fragment MultiDocumentRevision on MultiDocument {
    ...MultiDocumentMinimumInfo
    contents(version: $version) {
      ...RevisionEdit
    }
    tableOfContents(version: $version)
  }
`

export const MultiDocumentWithContributorsRevision = () => frag`
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
    textLastUpdatedAt
  }
`

export const WithVoteMultiDocument = () => frag`
  fragment WithVoteMultiDocument on MultiDocument {
    ...MultiDocumentMinimumInfo
  }
`


