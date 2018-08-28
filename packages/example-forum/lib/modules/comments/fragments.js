import { registerFragment } from 'meteor/vulcan:core';

// ----------------------------- Comments ------------------------------ //

registerFragment(/* GraphQL */`
  fragment CommentsList on Comment {
    # vulcan:comments
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
    # vulcan:posts
    post {
      _id
      commentCount
      commenters {
        ...UsersMinimumInfo
      }
    }
    # voting
    currentUserVotes{
      ...VoteFragment
    }
    baseScore
    score
  }
`);

