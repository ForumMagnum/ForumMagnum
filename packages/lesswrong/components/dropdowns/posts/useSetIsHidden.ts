import { useMutation } from '@apollo/client';
import { useCurrentUser } from '@/components/common/withUser';
import some from 'lodash/some';
import reject from 'lodash/reject';
import { gql } from '@/lib/generated/gql-codegen/gql';

export const useSetIsHiddenMutation = () => {
  const currentUser = useCurrentUser();
  
  const [setIsHiddenMutation] = useMutation(gql(`
    mutation setIsHidden($postId: String!, $isHidden: Boolean!) {
      setIsHidden(postId: $postId, isHidden: $isHidden) {
        ...UsersCurrent
      }
    }
  `));
  
  async function mutate(args: {postId: string, isHidden: boolean}) {
    if (!currentUser) {
      return;
    }

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
