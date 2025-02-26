import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment ModerationTemplateFragment on ModerationTemplate {
    _id
    name
    collectionName
    order
    deleted
    contents {
      ...RevisionEdit
    }
  }
`);
