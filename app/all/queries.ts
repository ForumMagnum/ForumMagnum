import { gql } from '@/lib/generated/gql-codegen';

// Top posts within a time window, used per-bucket on the /all page.
export const RecentActivityPostsQuery = gql(`
  query RecentActivityPostsQuery($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsList
      }
    }
  }
`);

// Top comments within a time window, including parent post/tag metadata.
export const RecentActivityCommentsQuery = gql(`
  query RecentActivityCommentsQuery($selector: CommentSelector, $limit: Int) {
    comments(selector: $selector, limit: $limit) {
      results {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);
