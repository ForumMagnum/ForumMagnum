export const SequencesPageTitleFragment = `
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

export const SequencesPageFragment = `
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

export const SequenceContinueReadingFragment = `
  fragment SequenceContinueReadingFragment on Sequence {
    _id
    title
    gridImageId
    canonicalCollectionSlug
  }
`

export const SequencesPageWithChaptersFragment = `
  fragment SequencesPageWithChaptersFragment on Sequence {
    ...SequencesPageFragment
    chapters {
      ...ChaptersFragment
    }
  }
`

export const SequencesEdit = `
  fragment SequencesEdit on Sequence {
    ...SequencesPageFragment
    contents { 
      ...RevisionEdit
    }
  }
`
