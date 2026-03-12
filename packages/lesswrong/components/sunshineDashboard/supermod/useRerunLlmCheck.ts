import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import type { InboxAction } from './inboxReducer';

const RerunLlmCheckMutation = gql(`
  mutation RerunLlmCheckHook($documentId: String!, $collectionName: ContentCollectionName!) {
    rerunLlmCheck(documentId: $documentId, collectionName: $collectionName) {
      ...AutomatedContentEvaluationsFragment
    }
  }
`);

export function useRerunLlmCheck(
  documentId: string | null,
  collectionName: 'Posts' | 'Comments',
  dispatch: React.Dispatch<InboxAction>
) {
  const { flash } = useMessages();
  const [rerunLlmCheck, { loading }] = useMutation(RerunLlmCheckMutation);

  const handleRerunLlmCheck = useCallback(async () => {
    if (!documentId || loading) return;

    // Set loading state in reducer so all components can see it
    dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId });

    try {
      const result = await rerunLlmCheck({
        variables: { documentId, collectionName },
        update: (cache, { data }) => {
          if (!data?.rerunLlmCheck) return;
          
          // Update the Apollo cache directly
          const typename = collectionName === 'Posts' ? 'Post' : 'Comment';
          cache.modify({
            id: cache.identify({ __typename: typename, _id: documentId }),
            fields: {
              automatedContentEvaluations: () => data.rerunLlmCheck,
            },
          });
        },
      });

      const newAce = result.data?.rerunLlmCheck;
      // For posts, also update the reducer since posts are stored in reducer state
      if (newAce && collectionName === 'Posts') {
        dispatch({
          type: 'UPDATE_POST',
          postId: documentId,
          fields: { automatedContentEvaluations: newAce },
        });
      }

      flash({ messageString: 'LLM check completed successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      flash({ messageString: `LLM check failed: ${errorMessage}`, type: 'error' });
    } finally {
      // Clear loading state
      dispatch({ type: 'SET_LLM_CHECK_RUNNING', documentId: null });
    }
  }, [documentId, collectionName, loading, rerunLlmCheck, dispatch, flash]);

  return {
    handleRerunLlmCheck,
    isRunningLlmCheck: loading,
  };
}
