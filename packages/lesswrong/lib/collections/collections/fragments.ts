import { frag } from "@/lib/fragments/fragmentWrapper";
import { UsersMinimumInfo } from "../users/fragments"
import { BookPageFragment } from "../books/fragments"

export const CollectionContinueReadingFragment = () => frag`
  fragment CollectionContinueReadingFragment on Collection {
    _id
    title
    slug
    gridImageId
  }
`

export const CollectionsPageFragment = () => frag`
  fragment CollectionsPageFragment on Collection {
    _id
    createdAt
    slug
    userId
    user {
      ${UsersMinimumInfo}
    }
    title
    contents {
      ...RevisionDisplay
    }
    firstPageLink
    gridImageId
    books {
      ${BookPageFragment}
    }
    hideStartReadingButton
    noindex
  }
`

export const CollectionsEditFragment = () => frag`
  fragment CollectionsEditFragment on Collection {
    ${CollectionsPageFragment}
    contents {
      ...RevisionEdit
    }
  }
`

export const CollectionsBestOfFragment = () => frag`
  fragment CollectionsBestOfFragment on Collection {
    _id
    createdAt
    slug
    userId
    user {
      ${UsersMinimumInfo}
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
