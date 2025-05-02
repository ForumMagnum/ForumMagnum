import { frag } from "@/lib/fragments/fragmentWrapper";

export const BookmarksDefaultFragment = () => frag`
  fragment BookmarksDefaultFragment on Bookmark {
    _id
    createdAt
    userId
    documentId
    collectionName
    lastUpdated
    cancelled
  }
`;

export const BookmarksWithDocumentFragment = () => frag`
  fragment BookmarksWithDocumentFragment on Bookmark {
    ...BookmarksDefaultFragment
    post {
      ...PostsListWithVotes
    }
  }
`;
