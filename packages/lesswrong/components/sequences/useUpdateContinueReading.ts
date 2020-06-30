import { useCallback  } from 'react';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';

export const useUpdateContinueReading = (postId: string, sequenceId: string): ()=>void => {
  const [updateContinueReading] = useMutation(gql`
    mutation updateContinueReading($sequenceId: String!, $postId: String!) {
      updateContinueReading(sequenceId: $sequenceId, postId: $postId)
    }
  `);
  
  return useCallback(() => {
    if (postId && sequenceId) {
      updateContinueReading({
        variables: { postId, sequenceId }
      });
    }
  }, [updateContinueReading, postId, sequenceId]);
}
