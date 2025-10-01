import { gql } from "@/lib/generated/gql-codegen";

export const ReviewWinnerAll = gql(`
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
`)

export const ReviewWinnerTopPostsPage = gql(`
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
`)

export const ReviewWinnerAnnouncement = gql(`
  fragment ReviewWinnerAnnouncement on ReviewWinner {
    _id
    category
    curatedOrder
    reviewYear
    reviewRanking
    competitorCount
    postId
    post {
      _id
      title
      slug
    }
  }
`)
