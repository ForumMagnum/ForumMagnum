import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment MultiDocumentEdit on MultiDocument {
    _id
    parentDocumentId
    collectionName
    contents {
      ...RevisionEdit
    }
  }
`);
