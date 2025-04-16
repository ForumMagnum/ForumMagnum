import { frag } from "@/lib/fragments/fragmentWrapper";

export const FeedPostFragment = () => frag`
  fragment FeedPostFragment on FeedPost {
    _id
    postMetaInfo
    post {
      ...UltraFeedPostFragment
    }
  }
`;

export const FeedCommentThreadFragment = () => frag`
  fragment FeedCommentThreadFragment on FeedCommentThread {
    _id
    commentMetaInfos
    comments {
      ...UltraFeedComment
    }
  }
`;

export const FeedSpotlightFragment = () => frag`
  fragment FeedSpotlightFragment on FeedSpotlightItem {
    _id
    spotlight {
      ...SpotlightDisplay
    }
  }
`;

