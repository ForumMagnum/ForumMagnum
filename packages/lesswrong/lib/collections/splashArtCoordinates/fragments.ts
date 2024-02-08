import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SplashArtCoordinates on SplashArtCoordinate {
    _id
    reviewWinnerArtId
    leftXPct
    leftYPct
    leftHeightPct
    leftWidthPct
    middleXPct
    middleYPct
    middleHeightPct
    middleWidthPct
    rightXPct
    rightYPct
    rightHeightPct
    rightWidthPct
  }
`);
