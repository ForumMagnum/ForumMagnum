import { gql } from "@/lib/generated/gql-codegen/gql";

export const MultiDocumentMinimumInfo = () => gql(`
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
`)

export const MultiDocumentContentDisplay = () => gql(`
  fragment MultiDocumentContentDisplay on MultiDocument {
    ...MultiDocumentMinimumInfo
    tableOfContents
    textLastUpdatedAt
    contents {
      ...RevisionEdit
    }
  }
`)

export const MultiDocumentEdit = () => gql(`
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
`)

export const MultiDocumentParentDocument = () => gql(`
  fragment MultiDocumentParentDocument on MultiDocument {
    ...MultiDocumentEdit
    parentTag {
      ...TagHistoryFragment
    }
  }
`)

export const MultiDocumentWithContributors = () => gql(`
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
`)

export const MultiDocumentRevision = () => gql(`
  fragment MultiDocumentRevision on MultiDocument {
    ...MultiDocumentMinimumInfo
    contents(version: $version) {
      ...RevisionEdit
    }
    tableOfContents(version: $version)
  }
`)

export const MultiDocumentWithContributorsRevision = () => gql(`
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
`)

export const WithVoteMultiDocument = () => gql(`
  fragment WithVoteMultiDocument on MultiDocument {
    ...MultiDocumentMinimumInfo
  }
`)


