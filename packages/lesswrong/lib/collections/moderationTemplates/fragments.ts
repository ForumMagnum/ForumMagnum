import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ModerationTemplateFragment on ModerationTemplate {
    _id
    name
    collectionName
    defaultOrder
    deleted
    contents {
      ...RevisionEdit
    }
  }
`);
