import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";


export const useModerateComment = () => {
  const [moderateComment] = useMutation(gql(`
    mutation moderateComment($commentId: String, $deleted: Boolean, $deletedReason: String, $deletedPublic: Boolean) {
      moderateComment(commentId: $commentId, deleted: $deleted, deletedReason: $deletedReason, deletedPublic: $deletedPublic) {
        ...CommentsList
      }
    }
  `));
  
  async function mutate(args: {commentId: string, deleted: boolean, deletedReason: string, deletedPublic?: boolean}) {
    return await moderateComment({
      variables: args
    });
  }
  
  return {moderateCommentMutation: mutate};
}

