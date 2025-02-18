import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CommentsList on Comment {
    _id
    postId
    tagId
    tag {
      _id
      slug
    }
    relevantTagIds
    relevantTags {
      ...TagPreviewFragment
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
    lastEditedAt
    repliesBlockedUntil
    userId
    deleted
    deletedPublic
    deletedByUserId
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
    emojiReactors
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
    shortformFrontpage
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
    debateResponse
    rejected
    rejectedReason
    modGPTRecommendation
    originalDialogueId
  }
`);

registerFragment(`
  fragment CommentsListWithTopLevelComment on Comment {
    ...CommentsList
    topLevelComment {
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
    relevantTags {
      ...TagPreviewFragment
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
    relevantTagIds
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
      isRead
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
      _id
      voteType
    }
  }
`);

registerFragment(`
  fragment CommentsListWithModGPTAnalysis on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
    modGPTAnalysis
  }
`);

registerFragment(`
  fragment CommentsForAutocomplete on Comment {
    _id
    postId
    baseScore
    extendedScore
    createdAt
    user {
      ...UsersMinimumInfo
    }
    contents {
      _id
      markdown
    }
    post {
      ...PostsForAutocomplete
    }
  }`)

registerFragment(`
  fragment CommentsForAutocompleteWithParents on Comment {
    ...CommentsForAutocomplete
    ${/* We dynamically construct a fragment that gets the parentComment and its parentComment, etc. for up to 10 levels */ ''}
    ${((depth: number): string => {
      const nested = (currentDepth: number): string => currentDepth === 0 ? '' : `
        parentComment {
          ...CommentsForAutocomplete${nested(currentDepth - 1)}
        }
      `;
    
      return `parentComment {
        ...CommentsForAutocomplete${nested(depth - 1)}
      }`.trim();
    })(10)}
  }
`);
