import { gql } from '@/lib/generated/gql-codegen';

export const SetPostSuggestedForAlignmentMutation = gql(`
  mutation setPostSuggestedForAlignment($postId: String!, $suggested: Boolean!) {
    setPostSuggestedForAlignment(postId: $postId, suggested: $suggested) {
      ...SuggestAlignmentPost
    }
  }
`);

export const SetCommentSuggestedForAlignmentMutation = gql(`
  mutation setCommentSuggestedForAlignment($commentId: String!, $suggested: Boolean!) {
    setCommentSuggestedForAlignment(commentId: $commentId, suggested: $suggested) {
      ...SuggestAlignmentComment
    }
  }
`);
