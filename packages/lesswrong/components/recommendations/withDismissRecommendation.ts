import { useCallback } from 'react';
import { gql } from '@apollo/client';
import { useMutate } from '../hooks/useMutate';

export const useDismissRecommendation = () => {
  const {mutate} = useMutate();
  
  return useCallback(async (postId: string) => {
    await mutate({
      mutation: gql`
        mutation dismissRecommendation($postId: String) {
          dismissRecommendation(postId: $postId)
        }
      `,
      variables: { postId },
      errorHandling: "flashMessageAndReturn",
    });
  }, [mutate]);
}
