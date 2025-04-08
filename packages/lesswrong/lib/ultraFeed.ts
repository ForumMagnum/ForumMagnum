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

export const FeedSpotlightFragment = `
  fragment FeedSpotlightFragment on FeedSpotlightItem {
    _id
    spotlight {
      ...SpotlightDisplay
    }
  }
`;

