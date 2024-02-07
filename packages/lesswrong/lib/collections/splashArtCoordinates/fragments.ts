import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SplashArtCoordinates on SplashArtCoordinate {
    _id
    reviewWinnerArtId
    reviewWinnerArt {
      ...ReviewWinnerArtImages
    }
    logTime
    xCoordinate
    yCoordinate
    width
    height
  }
`);
