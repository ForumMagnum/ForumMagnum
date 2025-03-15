/**
 * Fragment for UltraFeed items.
 * IMPORTANT: The post reference inside primaryComment MUST include the full PostsMinimumInfo 
 * fragment, not just _id. Components like UltraFeedCollapsedCommentItem need the full post
 * information, including title, for proper display.
 */
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
        ...PostsMinimumInfo
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

