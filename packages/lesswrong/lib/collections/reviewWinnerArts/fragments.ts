import { registerFragment } from '../../vulcan-lib/fragments';

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
