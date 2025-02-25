import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment ReviewWinnerEditDisplay on ReviewWinner {
    _id
    postId
    reviewYear
    curatedOrder
    reviewRanking
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
      splashArtImageUrl
      activeSplashArtCoordinates {
        ...SplashArtCoordinates
      }
    }
  }
`);
