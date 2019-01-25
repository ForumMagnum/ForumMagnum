import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment CommentsList on Comment {
    # example-forum
    _id
    postId
    parentCommentId
    topLevelCommentId
    body
    content {
      version
      updateType
      editedAt
      userId
      canonicalContent
      html
      markdown
      draftJS
      wordCount
      htmlHighlight
      plaintextDescription
    }
    postedAt
    repliesBlockedUntil
    # vulcan:users
    userId
    deleted
    deletedPublic
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
  }
`);
