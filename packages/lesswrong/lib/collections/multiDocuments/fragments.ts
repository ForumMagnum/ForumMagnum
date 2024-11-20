import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment MultiDocumentEdit on MultiDocument {
    _id
    parentDocumentId
    collectionName
    fieldName
    userId
    title
    tabTitle
    tabSubtitle
    preview
    index
    tableOfContents
    contents {
      ...RevisionEdit
    }
  }
`);
