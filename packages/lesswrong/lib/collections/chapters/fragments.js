import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment ChaptersFragment on Chapter {
    _id
    createdAt
    title
    subtitle
    description
    htmlDescription
    number
    sequenceId
    postIds
    posts {
      _id
      title
      url
      slug
      postedAt
      createdAt
      sticky
      status
      excerpt
      viewCount
      clickCount
      userId
      user {
        ...UsersMinimumInfo
        __typename
      }
      commentCount
      baseScore
      score
      __typename
      lastVisitedAt
    }
  }
`);
