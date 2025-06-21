import { useCallback  } from 'react';
import { useMutation } from "@apollo/client/react";
import { gql } from '@/lib/generated/gql-codegen';

export const useUpdateContinueReading = (postId: string|null|undefined, sequenceId: string|null|undefined): () => void => {
  const [updateContinueReading] = useMutation(gql(`
    mutation updateContinueReading($sequenceId: String!, $postId: String!) {
      updateContinueReading(sequenceId: $sequenceId, postId: $postId)
    }
  `));
  
  return useCallback(() => {
    if (postId && sequenceId) {
      void updateContinueReading({
        variables: { postId, sequenceId }
      });
    }
  }, [updateContinueReading, postId, sequenceId]);
}
