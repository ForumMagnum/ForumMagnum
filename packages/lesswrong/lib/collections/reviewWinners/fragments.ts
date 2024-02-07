import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ReviewWinnerEditDisplay on ReviewWinner {
    _id
    postId
    reviewYear
    curatedOrder
    reviewRanking
    isAI
  }
`);

registerFragment(`
  fragment ReviewWinnerAll on ReviewWinner {
    _id
    postId
    splashArtCoordinate {
      ...SplashArtCoordinates
    }
    reviewYear
    curatedOrder
    reviewRanking
    isAI
  }
`);
