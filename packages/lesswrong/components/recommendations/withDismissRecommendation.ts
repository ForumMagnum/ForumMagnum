import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';

export const useDismissRecommendation = () => {
  const [mutate] = useMutation(gql(`
    mutation dismissRecommendation($postId: String) {
      dismissRecommendation(postId: $postId)
    }
  `));
  
  return useCallback(async (postId: string) => {
    await mutate({
      variables: { postId }
    });
  }, [mutate]);
}
