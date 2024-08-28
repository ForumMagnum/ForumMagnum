import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SpotlightMinimumInfo on Spotlight {
    _id
    documentId
    documentType
    spotlightImageId
    spotlightDarkImageId
    spotlightSplashImageUrl
    draft
    position
    lastPromotedAt
    customTitle
    customSubtitle
    headerTitle
    headerTitleLeftColor
    headerTitleRightColor
    duration
    showAuthor
    imageFade
    imageFadeColor
  }
`)

registerFragment(`
  fragment SpotlightHeaderEventSubtitle on Spotlight {
    ...SpotlightMinimumInfo
    document {
      _id
      slug
    }
  }
`);
registerFragment(`
  fragment SpotlightDisplay on Spotlight {
    ...SpotlightMinimumInfo
    document {
      _id
      title
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
`);

registerFragment(`
  fragment SpotlightEditQueryFragment on Spotlight {
    ...SpotlightMinimumInfo
    description {
      ...RevisionEdit
    }
  }
`);
