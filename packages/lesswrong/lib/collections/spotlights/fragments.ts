import { gql } from "@/lib/generated/gql-codegen";

export const SpotlightMinimumInfo = gql(`
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
`)

export const SpotlightHeaderEventSubtitle = gql(`
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
`)
export const SpotlightDisplay = gql(`
  fragment SpotlightDisplay on Spotlight {
    ...SpotlightMinimumInfo
    post {
      _id
      slug
      title

      user {
        ...UsersMinimumInfo
      }
      reviews {
        _id
      }
    }
    sequence {
      _id
      title
      user {
        ...UsersMinimumInfo
      }
    }
    tag {
      _id
      name
      slug
      user {
        ...UsersMinimumInfo
      }
    }
    description {
      html
    }
  }
`)


export const SpotlightEditQueryFragment = gql(`
  fragment SpotlightEditQueryFragment on Spotlight {
    ...SpotlightMinimumInfo
    description {
      ...RevisionEdit
    }
  }
`)
