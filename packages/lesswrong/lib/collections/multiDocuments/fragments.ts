import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment MultiDocumentEdit on MultiDocument {
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
  fragment MultiDocumentParentDocument on MultiDocument {
    ...MultiDocumentEdit
    parentTag {
      ...TagBasicInfo
    }
  }
`);
