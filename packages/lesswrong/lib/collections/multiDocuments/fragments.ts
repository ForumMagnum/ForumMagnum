import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment MultiDocumentContentDisplay on MultiDocument {
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
    tableOfContents
    contents {
      ...RevisionEdit
    }
    legacyData
  }
`);

registerFragment(`
  fragment MultiDocumentEdit on MultiDocument {
    ...MultiDocumentContentDisplay
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
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
        contributionVolume
      }
    }
  }
`);
