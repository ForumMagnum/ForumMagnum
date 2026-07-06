import { frag } from "@/lib/fragments/fragmentWrapper"

export const SpotlightMinimumInfo = () => frag`
  fragment SpotlightMinimumInfo on Spotlight {
    _id
    documentId
    documentType
    title
    startAt
    endAt
    imageFadeColor
    imageId
  }
`

export const SpotlightReviewWinner = () => frag`
  fragment SpotlightReviewWinner on Spotlight {
    ...SpotlightMinimumInfo
    description {
      html
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
  }
`
export const SpotlightDisplay = () => frag`
  fragment SpotlightDisplay on Spotlight {
    ...SpotlightMinimumInfo
    post {
      ...PostsMinimumInfo
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
