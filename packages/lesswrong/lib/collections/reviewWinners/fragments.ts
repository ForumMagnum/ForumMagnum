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
  fragment ReviewWinnerTopPostsDisplay on ReviewWinner {
    _id
    postId
    post {
      ...PostsTopItemInfo
    }
    reviewYear
    curatedOrder
    reviewRanking
    isAI
  }
`);

registerFragment(`
  fragment ReviewWinnerAll on ReviewWinner {
    _id
    category
    curatedOrder
    postId
    reviewYear
    reviewRanking
    reviewWinnerArt {
      ...ReviewWinnerArtImages
    }
    isAI
    competitorCount
  }
`);

registerFragment(`
  fragment ReviewWinnerTopPostsPage on ReviewWinner {
    _id
    category
    curatedOrder
    reviewYear
    reviewRanking
    reviewWinnerArt {
      _id
      splashArtImageUrl
      activeSplashArtCoordinates {
        ...SplashArtCoordinates
      }
    }
  }
`);
