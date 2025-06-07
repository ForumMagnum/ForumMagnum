import { gql } from "@/lib/crud/wrapGql";

export const ReviewWinnerArtImages = gql(`
  fragment ReviewWinnerArtImages on ReviewWinnerArt {
    _id
    postId
    splashArtImagePrompt
    splashArtImageUrl
    activeSplashArtCoordinates {
      ...SplashArtCoordinatesEdit
    }
  }
`)
