import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SequencesPageTitleFragment on Sequence {
    _id
    title
    canonicalCollectionSlug
    canonicalCollection {
      title
    }
  }
`);

registerFragment(`
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
    curatedOrder
    userProfileOrder
    af
    epubUrl
  }
`);

registerFragment(`
  fragment SequenceContinueReadingFragment on Sequence {
    _id
    title
    gridImageId
    canonicalCollectionSlug
  }
`);

registerFragment(`
  fragment SequencesPageWithChaptersFragment on Sequence {
    ...SequencesPageFragment
    chapters {
      ...ChaptersFragment
    }
  }
`)

registerFragment(`
  fragment SequencesEdit on Sequence {
    ...SequencesPageFragment
    contents { 
      ...RevisionEdit
    }
  }
`)
