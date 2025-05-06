import { frag } from "@/lib/fragments/fragmentWrapper";

export const BookmarksWithDocumentFragment = () => frag`
  fragment BookmarksWithDocumentFragment on Bookmark {
    ...BookmarksDefaultFragment
    post {
      ...PostsListWithVotes
    }
  }
`;
