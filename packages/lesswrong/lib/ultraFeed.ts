export const UltraFeedItemFragment = `
  fragment UltraFeedItemFragment on UltraFeedItem {
    _id
    type
    renderAsType
    sources
    primaryComment {
      ...CommentsList
      parentCommentId
      topLevelCommentId
      post {
        _id
      }
    }
    primaryPost {
      ...PostsList
    }
    secondaryComments {
      ...CommentsList
    }
  }
`; 

// Keep these for backward compatibility but make them use the new UltraFeedItemFragment
export const FeedCommentFragment = UltraFeedItemFragment;
export const FeedPostFragment = UltraFeedItemFragment;
