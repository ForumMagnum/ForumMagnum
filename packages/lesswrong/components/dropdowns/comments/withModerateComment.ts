import { useMutation, gql } from '@apollo/client';
import { getFragment } from '../../../lib/vulcan-lib';

export const useModerateComment = ({fragmentName}: {
  fragmentName: FragmentName,
}) => {
  const [moderateComment] = useMutation(gql`
    mutation moderateComment($commentId: String, $deleted: Boolean, $deletedReason: String, $deletedPublic: Boolean) {
      moderateComment(commentId: $commentId, deleted: $deleted, deletedReason: $deletedReason, deletedPublic: $deletedPublic) {
        ...${fragmentName}
      }
    }
    ${getFragment(fragmentName)}
  `);
  
  async function mutate(args: {commentId: string, deleted: boolean, deletedReason: string, deletedPublic?: boolean}) {
    return await moderateComment({
      variables: args
    });
  }
  
  return {moderateCommentMutation: mutate};
}

