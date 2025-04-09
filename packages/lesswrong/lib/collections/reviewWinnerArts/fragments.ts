import { gql } from "@/lib/generated/gql-codegen/gql";

export const ReviewWinnerArtImages = () => gql(`
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
