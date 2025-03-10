export const CommentModeratorActionDisplay = `
  fragment CommentModeratorActionDisplay on CommentModeratorAction {
    _id
    comment {
      ...CommentsListWithModerationMetadata
    }
    commentId
    type
    active
    createdAt
    endedAt
  }
`
