import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { getFragment } from '../../../lib/vulcan-lib';
import { hookToHoc } from '../../../lib/hocUtils';

export const useModerateComment = ({fragmentName}: {
  fragmentName: FragmentName,
}) => {
  const fragment = getFragment(fragmentName);

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

