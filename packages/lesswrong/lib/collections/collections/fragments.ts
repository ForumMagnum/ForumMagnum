import { gql } from "@/lib/generated/gql-codegen/gql";
export const CollectionContinueReadingFragment = gql(`
  fragment CollectionContinueReadingFragment on Collection {
    _id
    title
    slug
    gridImageId
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

export const CollectionsBestOfFragment = gql(`
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
`)
