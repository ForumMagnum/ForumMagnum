import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment PostsList on Post {
    # example-forum
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
    # users
    userId
    user {
      ...UsersMinimumInfo
    }
    # embedly
    thumbnailUrl
    # example-forum
    categories {
      ...CategoriesMinimumInfo
    }
    # example-forum
    commentCount
    commenters {
      ...UsersMinimumInfo
    }
    # voting
    currentUserVotes{
      ...VoteFragment
    }
    baseScore
    score
  }
`);

registerFragment(`
  fragment PostsPage on Post {
    ...PostsList
    body
    htmlBody
  }
`);
