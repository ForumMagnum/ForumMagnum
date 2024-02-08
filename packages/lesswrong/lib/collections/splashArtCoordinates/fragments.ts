import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SplashArtCoordinates on SplashArtCoordinate {
    _id
    reviewWinnerArtId
    logTime
    xCoordinate
    yCoordinate
    width
    height
  }
`);
