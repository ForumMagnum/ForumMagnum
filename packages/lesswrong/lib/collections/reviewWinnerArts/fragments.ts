import { gql } from "@/lib/generated/gql-codegen";

export const ReviewWinnerArtImages = gql(`
  fragment ReviewWinnerArtImages on ReviewWinnerArt {
    _id
    createdAt
    postId
    splashArtImagePrompt
    splashArtImageUrl
    midjourneyJobId
    midjourneyImageIndex
    upscaledImageUrl
    activeSplashArtCoordinates {
      ...SplashArtCoordinatesEdit
    }
  }
`)
