export const CurationNoticesFragment = `
  fragment CurationNoticesFragment on CurationNotice {
    _id
    createdAt
    userId
    user {
      ...UsersMinimumInfo
    }
    commentId
    comment {
      ...CommentsList
    }
    postId
    post {
      ...PostsMinimumInfo
    }
    deleted
    contents {
      ...RevisionEdit
    }
  }
`
