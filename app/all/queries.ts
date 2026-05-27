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

// Fetch a comment plus up to four levels of ancestors so an expanded comment
// row can render its parent chain as SingleLineComments.
export const ActivityCommentParentsQuery = gql(`
  query ActivityCommentParentsQuery($commentId: String!) {
    comment(selector: { _id: $commentId }) {
      result {
        ...CommentsList
        parentComment {
          ...CommentsList
          parentComment {
            ...CommentsList
            parentComment {
              ...CommentsList
              parentComment {
                ...CommentsList
              }
            }
          }
        }
      }
    }
  }
`);
