import { frag } from "@/lib/fragments/fragmentWrapper";

export const ReviewWinnerArtImages = () => frag`
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
