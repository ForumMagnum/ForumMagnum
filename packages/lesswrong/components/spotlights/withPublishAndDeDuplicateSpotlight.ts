import { fragmentTextForQuery } from '@/lib/vulcan-lib/fragments';
import { useMutation, gql } from '@apollo/client';


export const usePublishAndDeDuplicateSpotlight = ({fragmentName}: {
  fragmentName: FragmentName,
}) => {
  const [publishAndDeDuplicateSpotlight] = useMutation(gql`
    mutation publishAndDeDuplicateSpotlight($spotlightId: String) {
      publishAndDeDuplicateSpotlight(spotlightId: $spotlightId) {
        ...${fragmentName}
      }
    }
    ${fragmentTextForQuery(fragmentName)}
  `);
  
  async function mutate(args: {spotlightId: string}) {
    return await publishAndDeDuplicateSpotlight({
      variables: args
    });
  }
  
  return {publishAndDeDuplicateSpotlight: mutate};
}

