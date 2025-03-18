export const ReviewWinnerArtImages = `
  fragment ReviewWinnerArtImages on ReviewWinnerArt {
    _id
    postId
    splashArtImagePrompt
    splashArtImageUrl
    activeSplashArtCoordinates {
      ...SplashArtCoordinates
    }
  }
`

export const ReviewWinnerArtImagesForYear = `
  fragment ReviewWinnerArtImagesForYear on ReviewWinnerArt {
    ...ReviewWinnerArtImages
    post {
      _id
      title
      slug
    }
  }
`
