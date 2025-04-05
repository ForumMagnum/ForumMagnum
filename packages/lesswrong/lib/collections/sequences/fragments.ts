import { frag } from "@/lib/fragments/fragmentWrapper"

export const SequencesPageTitleFragment = () => frag`
  fragment SequencesPageTitleFragment on Sequence {
    _id
    title
    canonicalCollectionSlug
    canonicalCollection {
      _id
      title
    }
  }
`

export const SequencesPageFragment = () => frag`
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
    canonicalCollectionSlug
    draft
    isDeleted
    hidden
    hideFromAuthorPage
    noindex
    curatedOrder
    userProfileOrder
    af
    postsCount
    readPostsCount
  }
`

export const SequenceContinueReadingFragment = () => frag`
  fragment SequenceContinueReadingFragment on Sequence {
    _id
    title
    gridImageId
    canonicalCollectionSlug
  }
`

export const SequencesPageWithChaptersFragment = () => frag`
  fragment SequencesPageWithChaptersFragment on Sequence {
    ...SequencesPageFragment
    chapters {
      ...ChaptersFragment
    }
  }
`

export const SequencesEdit = () => frag`
  fragment SequencesEdit on Sequence {
    ...SequencesPageFragment
    contents { 
      ...RevisionEdit
    }
  }
`
