import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CollectionsMinimumInfo on Collection {
    _id
    order
    createdAt
    slug
    userId
    title
    subtitle
    deleted
    firstPageLink
    libraryImageUrl
    gridImageId
  }
`)


registerFragment(`
  fragment CollectionsItemFragment on Collection {
    ...CollectionsMinimumInfo
    highlight {
      ...RevisionDisplay
    }
  }
`)

registerFragment(`
  fragment CollectionsPageFragment on Collection {
    ...CollectionsMinimumInfo
    user {
      ...UsersMinimumInfo
    }
    contents {
      ...RevisionDisplay
    }
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
