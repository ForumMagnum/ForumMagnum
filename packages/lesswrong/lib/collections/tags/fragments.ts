import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagFragment on Tag {
    _id
    name
    slug
    core
    postCount
    deleted
    description {
      html
      htmlHighlight
    }
  }
`);

registerFragment(`
  fragment TagEditFragment on Tag {
    _id
    name
    slug
    core
    suggestedAsFilter
    postCount
    deleted
    description {
      ...RevisionEdit
    }
  }
`);
