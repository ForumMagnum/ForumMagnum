import { frag } from "@/lib/fragments/fragmentWrapper"

export const ReviewWinnerEditDisplay = () => gql`
  fragment ReviewWinnerEditDisplay on ReviewWinner {
    _id
    postId
    reviewYear
    curatedOrder
    reviewRanking
  }
`

export const ReviewWinnerTopPostsDisplay = () => gql`
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

export const ReviewWinnerAll = () => gql`
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

export const ReviewWinnerTopPostsPage = () => gql`
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
