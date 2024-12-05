import { gql } from '@apollo/client';
import { useMutate } from '@/components/hooks/useMutate';
import { getFragment } from '../../../lib/vulcan-lib';

export const useModerateComment = ({fragmentName}: {
  fragmentName: FragmentName,
}) => {
  const {mutate} = useMutate();
  
  async function moderateCommentMutation(args: {commentId: string, deleted: boolean, deletedReason: string, deletedPublic?: boolean}) {
    return await mutate({
      mutation: gql`
        mutation moderateComment($commentId: String, $deleted: Boolean, $deletedReason: String, $deletedPublic: Boolean) {
          moderateComment(commentId: $commentId, deleted: $deleted, deletedReason: $deletedReason, deletedPublic: $deletedPublic) {
            ...${fragmentName}
          }
        }
        ${getFragment(fragmentName)}
      `,
      variables: args,
      errorHandling: "flashMessageAndReturn",
    });
  }
  
  return {moderateCommentMutation};
}

