import { gql } from "@/lib/generated/gql-codegen";
export const CollectionContinueReadingFragment = gql(`
  fragment CollectionContinueReadingFragment on Collection {
    _id
    title
    slug
    gridImageId
    coverImageId
    user {
      _id
      displayName
    }
  }
`)

export const LibraryCollectionRowFragment = gql(`
  fragment LibraryCollectionRowFragment on Collection {
    _id
    title
    slug
    gridImageId
    coverImageId
    libraryTopic
    postsCount
    readPostsCount
    user {
      ...UsersMinimumInfo
    }
    contents {
      _id
      plaintextDescription
    }
  }
`)

export const LibraryCollectionExpansionFragment = gql(`
  fragment LibraryCollectionExpansionFragment on Collection {
    _id
    books {
      _id
      title
      tocTitle
      number
      postsCount
      readPostsCount
    }
  }
`)

export const CollectionsPageFragment = gql(`
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
    coverImageId
    libraryTopic
    books {
      ...BookPageFragment
    }
    hideStartReadingButton
    noindex
  }
`)

export const CollectionsEditFragment = gql(`
  fragment CollectionsEditFragment on Collection {
    ...CollectionsPageFragment
    contents {
      ...RevisionEdit
    }
  }
`)
