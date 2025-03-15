/**
 * Fragment for loading comments with their associated post information
 * This is specifically designed for efficient loading of comments with
 * the minimal post information needed for display in UltraFeed
 */

export const UltraFeedCommentWithPostFragment = `
  fragment UltraFeedCommentWithPostFragment on Comment {
    ...CommentsList
    post {
      ...PostsMinimumInfo
    }
  }
`;
