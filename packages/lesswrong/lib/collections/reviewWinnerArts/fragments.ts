import { gql } from "@/lib/generated/gql-codegen";

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
