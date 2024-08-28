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
    contextInfo
    headerTitleLeftColor
    headerTitleRightColor
    duration
    showAuthor
    imageFade
    imageFadeColor
    pinned
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
        ...UsersMinimumInfo
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
