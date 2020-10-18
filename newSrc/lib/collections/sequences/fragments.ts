import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SequencesPageTitleFragment on Sequence {
    _id
    title
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
    color
    canonicalCollectionSlug
    draft
    isDeleted
    hidden
    curatedOrder
    userProfileOrder
    af
  }
`);

registerFragment(`
  fragment SequencesEdit on Sequence {
    ...SequencesPageFragment
    contents { 
      ...RevisionEdit
    }
  }
`)

registerFragment(`
  fragment SequencesNavigationFragment on Sequence {
    _id
    createdAt
    title
    color
    canonicalCollectionSlug
    draft
    isDeleted
    hidden
    curatedOrder
    chapters {
      _id
      title
      number
      sequenceId
      posts {
        _id
        slug
        title
        lastVisitedAt
        isRead
        excerpt
        baseScore
        score
        commentCount
        viewCount
        clickCount
      }
    }
  }
`);
