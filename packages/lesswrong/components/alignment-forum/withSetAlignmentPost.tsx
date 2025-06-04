import { fragmentTextForQuery } from '@/lib/vulcan-lib/fragments';
import { useMutation, gql } from '@apollo/client';

export const useSetAlignmentPost = ({fragmentName}: {fragmentName: FragmentName}) => {
  const [mutate] = useMutation(gql`
    mutation alignmentPost($postId: String, $af: Boolean) {
      alignmentPost(postId: $postId, af: $af) {
        ...${fragmentName}
      }
    }
    ${fragmentTextForQuery(fragmentName)}
  `)
  return {setAlignmentPostMutation: mutate};
}
