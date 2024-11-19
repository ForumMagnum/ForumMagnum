import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment MultiDocumentEdit on MultiDocument {
    _id
    parentDocumentId
    collectionName
    fieldName
    userId
    title
    subtitle
    index
    tableOfContents
    contents {
      ...RevisionEdit
    }
  }
`);
