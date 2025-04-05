import { frag } from "@/lib/fragments/fragmentWrapper"

export const SplashArtCoordinates = () => frag`
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
`

export const SplashArtCoordinatesEdit = () => frag`
  fragment SplashArtCoordinatesEdit on SplashArtCoordinate {
    ...SplashArtCoordinates
    createdAt
  }
`
