export const ReviewWinnerEditDisplay = `
  fragment ReviewWinnerEditDisplay on ReviewWinner {
    _id
    postId
    reviewYear
    curatedOrder
    reviewRanking
  }
`

export const ReviewWinnerTopPostsDisplay = `
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
`

export const ReviewWinnerAll = `
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
`

export const ReviewWinnerTopPostsPage = `
  fragment ReviewWinnerTopPostsPage on ReviewWinner {
    _id
    category
    curatedOrder
    reviewYear
    reviewRanking
    reviewWinnerArt {
      splashArtImageUrl
      activeSplashArtCoordinates {
        ...SplashArtCoordinatesEdit
      }
    }
  }
`
