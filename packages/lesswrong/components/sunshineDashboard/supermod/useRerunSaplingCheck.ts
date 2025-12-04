import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import type { InboxAction } from './inboxReducer';

const RerunSaplingCheckMutation = gql(`
  mutation RerunSaplingCheckHook($postId: String!) {
    rerunSaplingCheck(postId: $postId) {
      ...AutomatedContentEvaluationsFragment
    }
  }
`);

export function useRerunSaplingCheck(
  postId: string | null,
  dispatch: React.Dispatch<InboxAction>
) {
  const { flash } = useMessages();
  const [rerunSaplingCheck, { loading }] = useMutation(RerunSaplingCheckMutation);

  const handleRerunSaplingCheck = useCallback(async () => {
    if (!postId || loading) return;

    try {
      const result = await rerunSaplingCheck({
        variables: { postId },
        update: (cache, { data }) => {
          if (!data?.rerunSaplingCheck) return;
          
          // Update the Apollo cache directly for the post
          // This will update all places where this post is displayed
          cache.modify({
            id: cache.identify({ __typename: 'Post', _id: postId }),
            fields: {
              automatedContentEvaluations: () => data.rerunSaplingCheck,
            },
          });
        },
      });

      const newAce = result.data?.rerunSaplingCheck;
      // Also update the reducer for components that use it
      if (newAce) {
        dispatch({
          type: 'UPDATE_POST',
          postId,
          fields: { automatedContentEvaluations: newAce },
        });
      }

      flash({ messageString: 'Sapling check completed successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      flash({ messageString: `Sapling check failed: ${errorMessage}`, type: 'error' });
    }
  }, [postId, loading, rerunSaplingCheck, dispatch, flash]);

  return {
    handleRerunSaplingCheck,
    isRunningSaplingCheck: loading,
  };
}

