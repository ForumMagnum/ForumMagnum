/**
 * Fragment for UltraFeed items.
 */

/**
 * Fragment for both feedPost and feedCommentThread items
 * This includes both metadata fields and content fields loaded via IDs
 */

export const FeedPostFragment = `
  fragment FeedPostFragment on FeedPost {
    _id
    postMetaInfo
    post {
      ...PostsListWithVotes
    }
  }
`;

export const FeedCommentThreadFragment = `
  fragment FeedCommentThreadFragment on FeedCommentThread {
    _id
    commentMetaInfos
    comments {
      ...UltraFeedComment
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

