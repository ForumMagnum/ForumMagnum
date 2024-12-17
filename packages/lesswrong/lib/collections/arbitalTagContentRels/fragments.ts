import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ArbitalTagContentRelBasicInfo on ArbitalTagContentRel {
    _id
    parentDocumentId
    childDocumentId
    type
    level
    isStrong
    createdAt
  }
`);

registerFragment(`
  fragment ArbitalTagContentRelFragment on ArbitalTagContentRel {
    ...ArbitalTagContentRelBasicInfo
    parentDocument {
      ...TagPreviewFragment
    }
    childDocument {
      ...TagPreviewFragment
    }
  }
`);
