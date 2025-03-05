export const SubscribedPostAndCommentsFeed = `
  fragment SubscribedPostAndCommentsFeed on SubscribedPostAndComments {
    _id
    post {
      ...PostsList
    }
    comments {
      ...CommentsList
    }
    expandCommentIds
    postIsFromSubscribedUser
  }
`
