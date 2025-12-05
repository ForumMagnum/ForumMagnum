import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import type { InboxAction } from './inboxReducer';

const RerunSaplingCheckMutation = gql(`
  mutation RerunSaplingCheckHook($documentId: String!, $collectionName: ContentCollectionName!) {
    rerunSaplingCheck(documentId: $documentId, collectionName: $collectionName) {
      ...AutomatedContentEvaluationsFragment
    }
  }
`);

export function useRerunSaplingCheck(
  documentId: string | null,
  collectionName: 'Posts' | 'Comments',
  dispatch: React.Dispatch<InboxAction>
) {
  const { flash } = useMessages();
  const [rerunSaplingCheck, { loading }] = useMutation(RerunSaplingCheckMutation);

  const handleRerunSaplingCheck = useCallback(async () => {
    if (!documentId || loading) return;

    try {
      const result = await rerunSaplingCheck({
        variables: { documentId, collectionName },
        update: (cache, { data }) => {
          if (!data?.rerunSaplingCheck) return;
          
          // Update the Apollo cache directly
          const typename = collectionName === 'Posts' ? 'Post' : 'Comment';
          cache.modify({
            id: cache.identify({ __typename: typename, _id: documentId }),
            fields: {
              automatedContentEvaluations: () => data.rerunSaplingCheck,
            },
          });
        },
      });

      const newAce = result.data?.rerunSaplingCheck;
      // For posts, also update the reducer since posts are stored in reducer state
      if (newAce && collectionName === 'Posts') {
        dispatch({
          type: 'UPDATE_POST',
          postId: documentId,
          fields: { automatedContentEvaluations: newAce },
        });
      }

      flash({ messageString: 'Sapling check completed successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      flash({ messageString: `Sapling check failed: ${errorMessage}`, type: 'error' });
    }
  }, [documentId, collectionName, loading, rerunSaplingCheck, dispatch, flash]);

  return {
    handleRerunSaplingCheck,
    isRunningSaplingCheck: loading,
  };
}
