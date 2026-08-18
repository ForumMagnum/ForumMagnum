import { gql } from '@/lib/generated/gql-codegen';

export const PostsEditFormQuery = gql(`
  query PostsEditFormPost($documentId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsEditQueryFragment
      }
    }
  }
`);

export const CommentsListMultiQuery = gql(`
  query multiCommentPostsPageQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

export const postCommentsThreadQuery = gql(`
  query postCommentsThreadQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

export const linkedPostCommentQuery = gql(`
  query linkedPostCommentQuery($documentId: String!) {
    comment(selector: { _id: $documentId }) {
      result {
        _id
        postId
        topLevelCommentId
      }
    }
  }
`);

export const linkedPostCommentThreadQuery = gql(`
  query linkedPostCommentThreadQuery($topLevelCommentId: String!, $limit: Int) {
    comments(selector: { repliesToCommentThreadIncludingRoot: { topLevelCommentId: $topLevelCommentId } }, limit: $limit) {
      results {
        ...CommentsList
      }
    }
  }
`);

