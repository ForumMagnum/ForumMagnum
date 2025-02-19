import { useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';

export const useDismissRecommendation = () => {
  const [mutate] = useMutation(gql`
    mutation dismissRecommendation($postId: String) {
      dismissRecommendation(postId: $postId)
    }
  `);
  
  return useCallback(async (postId: string) => {
    await mutate({
      variables: { postId }
    });
  }, [mutate]);
}
