import { gql } from "@/lib/generated/gql-codegen";

export const CommentsList = gql(`
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
    draft
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
`)

export const CommentsListWithTopLevelComment = gql(`
  fragment CommentsListWithTopLevelComment on Comment {
    ...CommentsList
    topLevelComment {
      ...CommentsList
    }
  }
`)

export const UltraFeedComment = gql(`
  fragment UltraFeedComment on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
      votingSystem
    }
  }
`)

export const ShortformComments = gql(`
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

export const DraftComments = gql(`
  fragment DraftComments on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
    parentComment {
      _id
      user {
        ...UsersMinimumInfo
      }
    }
  }
`)

export const CommentWithRepliesFragment = gql(`
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
`)

export const CommentEdit = gql(`
  fragment CommentEdit on Comment {
    ...CommentsList
    relevantTagIds
    contents {
      ...RevisionEdit
    }
  }
`)

export const DeletedCommentsMetaData = gql(`
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

export const DeletedCommentsModerationLog = gql(`
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

export const CommentsListWithParentMetadata = gql(`
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
`)

// TODO: This is now the same as CommentWithRepliesFragment, now that said
// fragment gets the tag field
export const StickySubforumCommentFragment = gql(`
  fragment StickySubforumCommentFragment on Comment {
    ...CommentWithRepliesFragment
    tag {
      ...TagBasicInfo
    }
  }
`)

export const WithVoteComment = gql(`
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
`)

export const CommentsListWithModerationMetadata = gql(`
  fragment CommentsListWithModerationMetadata on Comment {
    ...CommentWithRepliesFragment
    allVotes {
      voteType
    }
  }
`)

export const CommentsListWithModGPTAnalysis = gql(`
  fragment CommentsListWithModGPTAnalysis on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
    modGPTAnalysis
  }
`)

export const CommentsForAutocomplete = gql(`
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
  }
`)

/**
 * Fragment that gets a comment with parents recursed up to 10 times. This was
 * previously implemented by dynamically constructing a graphql string with a
 * recursive function, but that didn't work well with codegen so it's now
 * fully unrolled.
 */
export const CommentsForAutocompleteWithParents = gql(`
  fragment CommentsForAutocompleteWithParents on Comment {
    ...CommentsForAutocomplete
    parentComment {
      ...CommentsForAutocomplete
      parentComment {
        ...CommentsForAutocomplete
        parentComment {
          ...CommentsForAutocomplete
          parentComment {
            ...CommentsForAutocomplete
            parentComment {
              ...CommentsForAutocomplete
              parentComment {
                ...CommentsForAutocomplete
                parentComment {
                  ...CommentsForAutocomplete
                  parentComment {
                    ...CommentsForAutocomplete
                    parentComment {
                      ...CommentsForAutocomplete
                      parentComment {
                        ...CommentsForAutocomplete
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`)

export const SuggestAlignmentComment = gql(`
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
  }
`)
