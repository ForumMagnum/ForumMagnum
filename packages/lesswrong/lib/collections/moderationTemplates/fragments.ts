import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ModerationTemplateFragment on ModerationTemplate {
    _id
    name
    defaultOrder
    deleted
    contents {
      ...RevisionEdit
    }
  }
`);
