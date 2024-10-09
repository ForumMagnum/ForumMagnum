import { useCallback  } from 'react';
import { gql } from '@apollo/client';
import { useMutate } from '../hooks/useMutate';

export const useUpdateContinueReading = (postId: string|null|undefined, sequenceId: string|null|undefined): () => void => {
  const {mutate} = useMutate();
  
  return useCallback(() => {
    if (postId && sequenceId) {
      void mutate({
        mutation: gql`
          mutation updateContinueReading($sequenceId: String!, $postId: String!) {
            updateContinueReading(sequenceId: $sequenceId, postId: $postId)
          }
        `,
        variables: { postId, sequenceId },
        errorHandling: "flashMessageAndReturn",
      });
    }
  }, [mutate, postId, sequenceId]);
}
