export const CommentsList = `
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

    forumEventId
    forumEventMetadata
  }
`

export const CommentsListWithTopLevelComment = `
  fragment CommentsListWithTopLevelComment on Comment {
    ...CommentsList
    topLevelComment {
      ...CommentsList
    }
  }
`

export const ShortformComments = `
  fragment ShortformComments on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
    relevantTags {
      ...TagPreviewFragment
    }
  }
`

export const CommentWithRepliesFragment = `
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
`

export const CommentEdit = `
  fragment CommentEdit on Comment {
    ...CommentsList
    relevantTagIds
    contents {
      ...RevisionEdit
    }
  }
`

export const DeletedCommentsMetaData = `
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
`

export const DeletedCommentsModerationLog = `
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
`

export const CommentsListWithParentMetadata = `
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
`

// TODO: This is now the same as CommentWithRepliesFragment, now that said
// fragment gets the tag field
export const StickySubforumCommentFragment = `
  fragment StickySubforumCommentFragment on Comment {
    ...CommentWithRepliesFragment
    tag {
      ...TagBasicInfo
    }
  }
`

export const WithVoteComment = `
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
`

export const CommentsListWithModerationMetadata = `
  fragment CommentsListWithModerationMetadata on Comment {
    ...CommentWithRepliesFragment
    allVotes {
      voteType
    }
  }
`

export const CommentsListWithModGPTAnalysis = `
  fragment CommentsListWithModGPTAnalysis on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
    modGPTAnalysis
  }
`

export const CommentsForAutocomplete = `
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
      markdown
    }
    post {
      ...PostsForAutocomplete
    }
  }`

export const CommentsForAutocompleteWithParents = `
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
`

export const SuggestAlignmentComment = `
  fragment SuggestAlignmentComment on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
    suggestForAlignmentUserIds
    suggestForAlignmentUsers {
      _id
      displayName
    }
  }`
