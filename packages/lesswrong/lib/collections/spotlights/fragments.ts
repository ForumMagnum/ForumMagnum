import { frag } from "@/lib/fragments/fragmentWrapper"

export const SpotlightMinimumInfo = () => frag`
  fragment SpotlightMinimumInfo on Spotlight {
    _id
    documentId
    documentType
    spotlightImageId
    spotlightDarkImageId
    spotlightSplashImageUrl
    draft
    deletedDraft
    position
    lastPromotedAt
    customTitle
    customSubtitle
    subtitleUrl
    headerTitle
    headerTitleLeftColor
    headerTitleRightColor
    duration
    showAuthor
    imageFade
    imageFadeColor
  }
`

export const SpotlightReviewWinner = () => frag`
  fragment SpotlightReviewWinner on Spotlight {
    ...SpotlightMinimumInfo
    description {
      html
    }
    sequenceChapters {
      ...ChaptersFragment
    }
  }
`

export const SpotlightHeaderEventSubtitle = () => frag`
  fragment SpotlightHeaderEventSubtitle on Spotlight {
    ...SpotlightMinimumInfo
    post {
      _id
      slug
    }
    sequence {
      _id
    }
    tag {
      _id
      slug
    }
  }
`
export const SpotlightDisplay = () => frag`
  fragment SpotlightDisplay on Spotlight {
    ...SpotlightMinimumInfo
    post {
      ...PostsMinimumInfo
      contents {
        wordCount
      }
      user {
        _id
        displayName
        slug
      }
      reviews {
        ...CommentsList
      }
    }
    sequence {
      _id
      title
      user {
        _id
        displayName
        slug
      }
    }
    tag {
      _id
      name
      slug
      user {
        _id
        displayName
        slug
      }
    }
    sequenceChapters {
      ...ChaptersFragment
    }
    description {
      html
    }
  }
`


export const SpotlightEditQueryFragment = () => frag`
  fragment SpotlightEditQueryFragment on Spotlight {
    ...SpotlightMinimumInfo
    description {
      ...RevisionEdit
    }
  }
`
