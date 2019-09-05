import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment SequencesPageFragment on Sequence {
    _id
    createdAt
    userId
    user {
      ...UsersMinimumInfo
    }
    title
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
