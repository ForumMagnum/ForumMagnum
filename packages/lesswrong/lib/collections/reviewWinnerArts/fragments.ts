import { frag } from "@/lib/fragments/fragmentWrapper";

export const ReviewWinnerArtImages = () => gql`
  fragment ReviewWinnerArtImages on ReviewWinnerArt {
    _id
    postId
    splashArtImagePrompt
    splashArtImageUrl
    activeSplashArtCoordinates {
      ...SplashArtCoordinatesEdit
    }
  }
`
