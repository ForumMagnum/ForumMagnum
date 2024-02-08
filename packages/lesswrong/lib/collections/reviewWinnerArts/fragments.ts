import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ReviewWinnerArtImages on ReviewWinnerArt {
    _id
    postId
    splashArtImagePrompt
    splashArtImageUrl
    activeSplashArtCoordinates {
      ...SplashArtCoordinates
    }
  }
`);
