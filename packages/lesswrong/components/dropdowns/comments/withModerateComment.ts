import { fragmentTextForQuery } from '@/lib/vulcan-lib/fragments';
import { useMutation, gql } from '@apollo/client';


export const useModerateComment = ({fragmentName}: {
  fragmentName: FragmentName,
}) => {
  // Factored out because GraphQL syntax checking is not happy with dynamically inserted fragment name
  const gqlString = `
    mutation moderateComment($commentId: String, $deleted: Boolean, $deletedReason: String, $deletedPublic: Boolean) {
      moderateComment(commentId: $commentId, deleted: $deleted, deletedReason: $deletedReason, deletedPublic: $deletedPublic) {
        ...${fragmentName}
      }
    }
    ${fragmentTextForQuery(fragmentName)}
  `

  const [moderateComment] = useMutation(gql`${gqlString}`);
  
  async function mutate(args: {commentId: string, deleted: boolean, deletedReason: string, deletedPublic?: boolean}) {
    return await moderateComment({
      variables: args
    });
  }
  
  return {moderateCommentMutation: mutate};
}

