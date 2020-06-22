import { registerFragment } from '../../vulcan-lib';

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
    moderatorHat
    nominatedForReview
    reviewingForReview
    promoted
    promotedByUserId
    promotedByUser {
      ...UsersMinimumInfo
    }
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
      ...PostsMinimumInfo
    }
  }
`)

registerFragment(`
  fragment CommentWithRepliesFragment on Comment {
    ...CommentsList
    lastSubthreadActivity
    latestChildren {
      ...CommentsList
    }
    post {
      ...PostsBase
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
