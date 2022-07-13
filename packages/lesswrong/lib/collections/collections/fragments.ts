import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CollectionsMinimumInfo on Collection {
    _id
    createdAt
    slug
    userId
    title
    firstPageLink
    gridImageId
    books {
      ...BooksMinimumFragment
    }
  }
`)


registerFragment(`
  fragment CollectionsItemFragment on Collection {
    ...CollectionsMinimumInfo
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
