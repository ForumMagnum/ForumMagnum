export const FeedCommentFragment = `
  fragment FeedCommentFragment on FeedComment {
    _id
    comment {
      ...CommentsList
      parentCommentId
      topLevelCommentId
      post {
        _id
      }
    }
    sources
  }
`; 