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

export const FeedPostFragment = `
  fragment FeedPostFragment on FeedPost {
    _id
    post {
      ...PostsList
    }
    comments {
      ...CommentsList
    }
    sources
  }
`; 
