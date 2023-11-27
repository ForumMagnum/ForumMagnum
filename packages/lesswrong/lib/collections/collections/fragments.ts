import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CollectionContinueReadingFragment on Collection {
    _id
    title
    slug
    gridImageId
  }
`);

registerFragment(`
  fragment CollectionsPageFragment on Collection {
    _id
    createdAt
    slug
    userId
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
    hideStartReadingButton
    noindex
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

registerFragment(`
  fragment CollectionsBestOfFragment on Collection {
    _id
    createdAt
    slug
    userId
    user {
      ...UsersMinimumInfo
    }
    title
    gridImageId
    noindex
    postsCount
    readPostsCount
    contents {
      ...RevisionDisplay
    }
  }
`);
