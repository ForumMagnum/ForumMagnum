import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment CommentsList on Comment {
    # example-forum
    _id
    postId
    parentCommentId
    topLevelCommentId
    contents {
      ...RevisionDisplay
      plaintextMainText
    }
    postedAt
    repliesBlockedUntil
    # vulcan:users
    userId
    deleted
    deletedPublic
    deletedReason
    hideAuthor
    user {
      ...UsersMinimumInfo
    }
    # vulcan:voting
    currentUserVotes {
      ...VoteFragment
    }
    baseScore
    score
    voteCount
    af
    afDate
    moveToAlignmentUserId
    afBaseScore
    suggestForAlignmentUserIds
    needsReview
    answer
    parentAnswerId
    retracted
    postVersion
    reviewedByUserId
    shortform
    lastSubthreadActivity
  }
`);

registerFragment(`
  fragment CommentPermalink on Comment {
    ...CommentsList
    parentComment {
      ...CommentsList
    }
  }
`);

registerFragment(`
  fragment ShortformComments on Comment {
    ...CommentsList
    post {
      _id
      slug
      title
    }
  }
`)

registerFragment(`
  fragment CommentWithReplies on Comment {
    ...CommentsList
    lastSubthreadActivity
    latestChildren {
      ...CommentsList
    }
    post {
      title
      _id
      slug
      lastVisitedAt
    }
  }
`);

registerFragment(`
  fragment CommentEdit on Comment {
    ...CommentsList
    contents {
      ...RevisionEdit
    }
  }
`);
