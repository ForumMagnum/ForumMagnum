import { gql } from "@/lib/crud/wrapGql";

export const SplashArtCoordinates = gql(`
  fragment SplashArtCoordinates on SplashArtCoordinate {
    _id
    reviewWinnerArtId
    leftXPct
    leftYPct
    leftHeightPct
    leftWidthPct
    leftFlipped
    middleXPct
    middleYPct
    middleHeightPct
    middleWidthPct
    middleFlipped
    rightXPct
    rightYPct
    rightHeightPct
    rightWidthPct
    rightFlipped
  }
`)

export const SplashArtCoordinatesEdit = gql(`
  fragment SplashArtCoordinatesEdit on SplashArtCoordinate {
    ...SplashArtCoordinates
    createdAt
  }
`)
