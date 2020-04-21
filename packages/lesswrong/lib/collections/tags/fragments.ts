import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagBasicInfo on Tag {
    _id
    name
    slug
    core
    postCount
    deleted
    adminOnly
  }
`);

registerFragment(`
  fragment TagFragment on Tag {
    ...TagBasicInfo
    description {
      html
      htmlHighlight
    }
  }
`);

registerFragment(`
  fragment TagPreviewFragment on Tag {
    ...TagBasicInfo
    description {
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
