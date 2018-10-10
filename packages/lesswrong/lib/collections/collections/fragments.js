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
    description
    htmlDescription
    firstPageLink
    gridImageId
    books {
      ...BookPageFragment
    }
  }
`);
