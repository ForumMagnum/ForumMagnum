import { useCallback  } from 'react';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';

export const useUpdateContinueReading = (postId: string|null|undefined, sequenceId: string|null|undefined): ()=>void => {
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
