import { registerFragment } from '../../vulcan-lib';

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
