import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ArbitalTagContentRelBasicInfo on ArbitalTagContentRel {
    _id
    parentTagId
    childTagId
    type
    level
    isStrong
    createdAt
  }
`);

registerFragment(`
  fragment ArbitalTagContentRelFragment on ArbitalTagContentRel {
    ...ArbitalTagContentRelBasicInfo
    parentTag {
      ...TagPreviewFragment
    }
    childTag {
      ...TagPreviewFragment
    }
  }
`); 