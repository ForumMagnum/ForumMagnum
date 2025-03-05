export const CollectionContinueReadingFragment = `
  fragment CollectionContinueReadingFragment on Collection {
    _id
    title
    slug
    gridImageId
  }
`

export const CollectionsPageFragment = `
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
`

export const CollectionsEditFragment = `
  fragment CollectionsEditFragment on Collection {
    ...CollectionsPageFragment
    contents {
      ...RevisionEdit
    }
  }
`

export const CollectionsBestOfFragment = `
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
`
