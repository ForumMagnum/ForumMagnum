import { gql } from "@/lib/generated/gql-codegen";
export const CollectionContinueReadingFragment = gql(`
  fragment CollectionContinueReadingFragment on Collection {
    _id
    title
    slug
    gridImageId
    coverImageId
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
