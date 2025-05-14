import { frag } from "@/lib/fragments/fragmentWrapper";

export const BookmarksWithDocumentFragment = () => frag`
  fragment BookmarksWithDocumentFragment on Bookmark {
    ...BookmarksDefaultFragment
    post {
      ...PostsListWithVotes
    }
  }
`;

export const BookmarksFeedItemFragment = () => frag`
  fragment BookmarksFeedItemFragment on Bookmark {
    ...BookmarksDefaultFragment
    post {
      ...PostsListWithVotes
    }
    comment {
      ...UltraFeedComment
    }
  }
`;
