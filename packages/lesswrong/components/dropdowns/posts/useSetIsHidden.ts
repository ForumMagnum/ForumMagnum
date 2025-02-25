import { useMutation, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../../lib/vulcan-lib/fragments';
import { useCurrentUser } from '@/components/common/withUser';
import some from 'lodash/some';
import reject from 'lodash/reject';

export const useSetIsHiddenMutation = () => {
  const currentUser = useCurrentUser();
  
  const [setIsHiddenMutation] = useMutation(gql`
    mutation setIsHidden($postId: String!, $isHidden: Boolean!) {
      setIsHidden(postId: $postId, isHidden: $isHidden) {
        ...UsersCurrent
      }
    }
    ${fragmentTextForQuery("UsersCurrent")}
  `);
  
  async function mutate(args: {postId: string, isHidden: boolean}) {
    const { postId, isHidden } = args;

    // FIXME: this mutation logic is duplicated from the mutation - ideally we'd
    // like to have a single implementation, but there wasn't an obvious place to
    // share this logic.
    const oldHiddenList = currentUser?.hiddenPostsMetadata || [];
    let newHiddenList: Array<{postId: string}>;

    if (isHidden) {
      const alreadyHidden = some(
        oldHiddenList,
        (hiddenMetadata) => hiddenMetadata.postId === postId,
      );
      newHiddenList = alreadyHidden
        ? oldHiddenList
        : [...oldHiddenList, {postId: postId}];
    } else {
      newHiddenList = reject(
        oldHiddenList,
        (hiddenMetadata) => hiddenMetadata.postId === postId,
      );
    }

    return await setIsHiddenMutation({
      variables: args,
      optimisticResponse: {
        setIsHidden: {
          ...currentUser,
          hiddenPostsMetadata: newHiddenList,
        },
      }
    });
  }
  
  return {setIsHiddenMutation: mutate};
}
