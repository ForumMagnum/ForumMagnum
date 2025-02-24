import { useMutation, gql } from '@apollo/client';
import { getFragment } from '../../lib/vulcan-lib/fragments';

export const usePublishAndDeDuplicateSpotlight = ({fragmentName}: {
  fragmentName: FragmentName,
}) => {
  const [publishAndDeDuplicateSpotlight] = useMutation(gql`
    mutation publishAndDeDuplicateSpotlight($spotlightId: String) {
      publishAndDeDuplicateSpotlight(spotlightId: $spotlightId) {
        ...${fragmentName}
      }
    }
    ${getFragment(fragmentName)}
  `);
  
  async function mutate(args: {spotlightId: string}) {
    return await publishAndDeDuplicateSpotlight({
      variables: args
    });
  }
  
  return {publishAndDeDuplicateSpotlight: mutate};
}

