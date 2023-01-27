import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CommentsList on Comment {
    _id
    postId
    tagId
    tag {
      slug
    }
    tagCommentType
    parentCommentId
    topLevelCommentId
    descendentCount
    title
    contents {
      _id
      html
      plaintextMainText
      wordCount
    }
    postedAt
    repliesBlockedUntil
    userId
    deleted
    deletedPublic
    deletedReason
    hideAuthor
    authorIsUnreviewed
    user {
      ...UsersMinimumInfo
    }
    currentUserVote
    currentUserExtendedVote
    baseScore
    extendedScore
    score
    voteCount
    af
    afDate
    moveToAlignmentUserId
    afBaseScore
    afExtendedScore
    suggestForAlignmentUserIds
    reviewForAlignmentUserId
    needsReview
    answer
    parentAnswerId
    retracted
    postVersion
    reviewedByUserId
    shortform
    lastSubthreadActivity
    moderatorHat
    hideModeratorHat
    nominatedForReview
    reviewingForReview
    promoted
    promotedByUser {
      ...UsersMinimumInfo
    }
    directChildrenCount
    votingSystem
    isPinnedOnProfile
    commentApproval {
      ...CommentApprovalWithoutComment
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
    tag {
      ...TagBasicInfo
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
  fragment CommentsListWithParentMetadata on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
    tag {
      ...TagBasicInfo
    }
  }
`);

// TODO: This is now the same as CommentWithRepliesFragment, now that said
// fragment gets the tag field
registerFragment(`
  fragment StickySubforumCommentFragment on Comment {
    ...CommentWithRepliesFragment
    tag {
      ...TagBasicInfo
    }
  }
`);

registerFragment(`
  fragment WithVoteComment on Comment {
    __typename
    _id
    currentUserVote
    currentUserExtendedVote
    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    voteCount
  }
`);

registerFragment(`
  fragment CommentsListWithModerationMetadata on Comment {
    ...CommentWithRepliesFragment
    allVotes {
      voteType
    }
  }
`);
