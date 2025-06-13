import { useMutation } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';

export const useSetAlignmentPost = () => {
  const [mutate] = useMutation(gql(`
    mutation alignmentPost($postId: String, $af: Boolean) {
      alignmentPost(postId: $postId, af: $af) {
        ...PostsList
      }
    }
  `));

  return {setAlignmentPostMutation: mutate};
}
