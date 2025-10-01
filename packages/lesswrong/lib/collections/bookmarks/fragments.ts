import { gql } from "@/lib/generated/gql-codegen";

export const BookmarksMinimumInfoFragment = gql(`
  fragment BookmarksMinimumInfoFragment on Bookmark {
    _id
    active
  }
`);

export const BookmarksWithDocumentFragment = gql(`
  fragment BookmarksWithDocumentFragment on Bookmark {
    ...BookmarksMinimumInfoFragment
    post {
      ...PostsListWithVotes
    }
  }
`);

export const BookmarksFeedItemFragment = gql(`
  fragment BookmarksFeedItemFragment on Bookmark {
    ...BookmarksMinimumInfoFragment
    collectionName
    lastUpdated
    post {
      ...PostsListWithVotes
    }
    comment {
      ...UltraFeedComment
    }
  }
`);
