import { registerFragment } from '../../vulcan-lib';

registerFragment(`
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
`);

registerFragment(`
  fragment MultiDocumentContentDisplay on MultiDocument {
    ...MultiDocumentMinimumInfo
    tableOfContents
    contents {
      ...RevisionEdit
    }
  }
`);

registerFragment(`
  fragment MultiDocumentEdit on MultiDocument {
    ...MultiDocumentContentDisplay
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
    summaries {
      ...MultiDocumentContentDisplay
    }
  }
`);

registerFragment(`
  fragment MultiDocumentParentDocument on MultiDocument {
    ...MultiDocumentEdit
    parentTag {
      ...TagHistoryFragment
    }
  }
`);

registerFragment(`
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
`);

registerFragment(`
  fragment MultiDocumentRevision on MultiDocument {
    ...MultiDocumentMinimumInfo
    contents(version: $version) {
      ...RevisionEdit
    }
    tableOfContents(version: $version)
  }
`);

registerFragment(`
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
`);

registerFragment(`
  fragment WithVoteMultiDocument on MultiDocument {
    ...MultiDocumentMinimumInfo
  }
`);
