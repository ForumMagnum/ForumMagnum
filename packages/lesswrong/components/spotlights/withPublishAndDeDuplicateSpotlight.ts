import { useMutation } from "@apollo/client/react";
import { gql } from '@/lib/generated/gql-codegen';

export const usePublishAndDeDuplicateSpotlight = () => {
  const [publishAndDeDuplicateSpotlight] = useMutation(gql(`
    mutation publishAndDeDuplicateSpotlight($spotlightId: String) {
      publishAndDeDuplicateSpotlight(spotlightId: $spotlightId) {
        ...SpotlightDisplay
      }
    }
  `));

  async function mutate(args: {spotlightId: string}) {
    return await publishAndDeDuplicateSpotlight({
      variables: args
    });
  }
  
  return {publishAndDeDuplicateSpotlight: mutate};
}

