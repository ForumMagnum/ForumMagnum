import { gql } from "@/lib/generated/gql-codegen";

export const SequencesPageTitleFragment = gql(`
  fragment SequencesPageTitleFragment on Sequence {
    _id
    title
    canonicalCollectionSlug
    canonicalCollection {
      _id
      title
    }
  }
`)

export const SequencesPageFragment = gql(`
  fragment SequencesPageFragment on Sequence {
    ...SequencesPageTitleFragment
    createdAt
    userId
    user {
      ...UsersMinimumInfo
    }
    contents {
      ...RevisionDisplay
    }
    gridImageId
    bannerImageId
    coverImageId
    canonicalCollectionSlug
    draft
    isDeleted
    hidden
    hideFromAuthorPage
    noindex
    curatedOrder
    libraryTopic
    userProfileOrder
    af
    postsCount
    readPostsCount
  }
`)

export const SequenceContinueReadingFragment = gql(`
  fragment SequenceContinueReadingFragment on Sequence {
    _id
    title
    gridImageId
    coverImageId
    canonicalCollectionSlug
    user {
      _id
      displayName
    }
  }
`)

export const LibrarySequenceRowFragment = gql(`
  fragment LibrarySequenceRowFragment on Sequence {
    _id
    title
    gridImageId
    coverImageId
    bannerImageId
    curatedOrder
    libraryTags {
      _id
      name
      slug
      core
    }
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

export const LibrarySequenceExpansionFragment = gql(`
  fragment LibrarySequenceExpansionFragment on Sequence {
    _id
    chapters {
      _id
      title
      number
      posts {
        ...ChapterPostSlim
      }
    }
  }
`)

export const SequencesPageWithChaptersFragment = gql(`
  fragment SequencesPageWithChaptersFragment on Sequence {
    ...SequencesPageFragment
    chapters {
      ...SlimChapter
    }
  }
`)

export const SequencesEdit = gql(`
  fragment SequencesEdit on Sequence {
    ...SequencesPageFragment
    contents { 
      ...RevisionEdit
    }
  }
`)
