import { gql } from '@/lib/generated/gql-codegen';

export const DraftCommentsQuery = gql(`
  query DraftCommentsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...DraftComments
      }
      totalCount
    }
  }
`);

export const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentRecentCommentsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);
