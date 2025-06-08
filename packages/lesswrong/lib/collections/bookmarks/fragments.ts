import { gql } from "@/lib/crud/wrapGql";

export const BookmarksWithDocumentFragment = gql(`
  fragment BookmarksWithDocumentFragment on Bookmark {
    ...BookmarksDefaultFragment
    post {
      ...PostsListWithVotes
    }
  }
`);

export const BookmarksFeedItemFragment = gql(`
  fragment BookmarksFeedItemFragment on Bookmark {
    ...BookmarksDefaultFragment
    post {
      ...PostsListWithVotes
    }
    comment {
      ...UltraFeedComment
    }
  }
`);
