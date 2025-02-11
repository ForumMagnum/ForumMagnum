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

registerFragment(`
  fragment SpotlightReviewWinner on Spotlight {
    ...SpotlightMinimumInfo
    description {
      html
    }
    sequenceChapters {
      ...ChaptersFragment
    }
  }
`);

registerFragment(`
  fragment SpotlightHeaderEventSubtitle on Spotlight {
    ...SpotlightMinimumInfo
    document {
      __typename
      _id
      ... on Post {
        slug
      }
      ... on Tag {
        slug
      }
    }
  }
`);
registerFragment(`
  fragment SpotlightDisplay on Spotlight {
    ...SpotlightMinimumInfo
    document {
      __typename
      ... on Post {
        _id
        title
        slug
        user {
          _id
          displayName
          slug
        }
        reviews {
          ...CommentsList
        }
      }
      ... on Sequence {
        _id
        title
        user {
          _id
          displayName
          slug
        }
      }
      ... on Tag {
        _id
        name
        slug
        user {
          _id
          displayName
          slug
        }
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
