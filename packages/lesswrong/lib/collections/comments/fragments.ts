import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CommentsList on Comment {
    _id
    postId
    parentCommentId
    topLevelCommentId
    contents {
      html
      plaintextMainText
    }
    postedAt
    repliesBlockedUntil
    userId
    deleted
    deletedPublic
    deletedReason
    hideAuthor
    user {
      ...UsersMinimumInfo
    }
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
    directChildrenCount
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

registerFragment(`
  fragment DeletedCommentsMetaData on Comment {
    _id
    deleted
    deletedDate
    deletedByUser {
      _id
      displayName
    }
    deletedReason
    deletedPublic
  }
`)

registerFragment(`
  fragment DeletedCommentsModerationLog on Comment {
    ...DeletedCommentsMetaData
    user {
      ...UsersMinimumInfo
    }
    post {
      title
      slug
      _id
    }
  }
`)

registerFragment(`
  fragment CommentsListWithPostMetadata on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
  }
`);

registerFragment(`
  fragment WithVoteComment on Comment {
    __typename
    _id
    currentUserVotes{
      _id
      voteType
      power
    }
    baseScore
    score
    afBaseScore
    voteCount
  }
`);
