import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment CollectionsPageFragment on Collection {
    _id
    createdAt
    slug
    user {
      ...UsersMinimumInfo
    }
    title
    contents {
      ...RevisionDisplay
    }
    firstPageLink
    gridImageId
    books {
      ...BookPageFragment
    }
  }
`);

registerFragment(`
  fragment CollectionsEditFragment on Collection {
    ...CollectionsPageFragment
    contents {
      ...RevisionEdit
    }
  }
`);
