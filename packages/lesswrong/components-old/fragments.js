import { registerFragment } from 'meteor/vulcan:core';

// ------------------------------ Vote ------------------------------ //

// note: fragment used by default on the UsersProfile fragment
registerFragment(`
  fragment VotedItem on Vote {
    # vulcan:voting
    itemId
    power
    votedAt
  }
`);

// ------------------------------ Users ------------------------------ //

// note: fragment used by default on UsersProfile, PostsList & CommentsList fragments
registerFragment(`
  fragment UsersMinimumInfo on User {
    # vulcan:users
    _id
    slug
    username
    displayName
    emailHash
  }
`);

registerFragment(`
  fragment UsersProfile on User {
    # vulcan:users
    ...UsersMinimumInfo
    createdAt
    isAdmin
    bio
    htmlBio
    twitterUsername
    website
    groups
    karma
    # example-forum
    postCount
    # example-forum
    commentCount
    # vulcan:voting
    downvotedComments {
      ...VotedItem
    }
    downvotedPosts {
      ...VotedItem
    }
    upvotedComments {
      ...VotedItem
    }
    upvotedPosts {
      ...VotedItem
    }
  }
`);

// ------------------------------ Categories ------------------------------ //

// note: fragment used by default on CategoriesList & PostsList fragments
registerFragment(`
  fragment CategoriesMinimumInfo on Category {
    # example-forum
    _id
    name
    slug
  }
`);

registerFragment(`
  fragment CategoriesList on Category {
    # example-forum
    ...CategoriesMinimumInfo
    description
    order
    image
    parentId
    parent {
      ...CategoriesMinimumInfo
    }
  }
`);

// ------------------------------ Posts ------------------------------ //

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
    body
    htmlBody
    excerpt
    viewCount
    clickCount
    # vulcan:users
    userId
    user {
      ...UsersMinimumInfo
    }
    # vulcan:embedly
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
    # vulcan:voting
    upvoters {
      _id
    }
    downvoters {
      _id
    }
    upvotes
    downvotes
    baseScore
    score
  }
`);

registerFragment(`
  fragment PostsPage on Post {
    ...PostsList
  }
`);


// ----------------------------- Comments ------------------------------ //

registerFragment(`
  fragment CommentsList on Comment {
    # example-forum
    _id
    postId
    parentCommentId
    topLevelCommentId
    body
    htmlBody
    postedAt
    # vulcan:users
    userId
    user {
      ...UsersMinimumInfo
    }
    # example-forum
    post {
      _id
      commentCount
      commenters {
        ...UsersMinimumInfo
      }
    }
    # vulcan:voting
    upvoters {
      _id
    }
    downvoters {
      _id
    }
    upvotes
    downvotes
    baseScore
    score
  }
`);
