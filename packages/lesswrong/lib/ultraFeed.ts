/**
 * Fragment for UltraFeed items.
 */

/**
 * Fragment for both feedPost and feedCommentThread items
 * This includes both metadata fields and content fields loaded via IDs
 */

export const FeedPostWithCommentsFragment = `
  fragment FeedPostWithCommentsFragment on UltraFeedPostWithComments {
    _id
    postMetaInfo
    commentMetaInfos
    post {
      ...PostsListWithVotes
    }
    comments {
      ...CommentsList
    }
  }
`;

/**
 * Fragment for feedSpotlight items in UltraFeed
 * This matches the structure returned by the UltraFeed resolver
 */
export const FeedSpotlightFragment = `
  fragment FeedSpotlightFragment on FeedSpotlightItem {
    _id
    spotlight {
      ...SpotlightDisplay
    }
  }
`;

