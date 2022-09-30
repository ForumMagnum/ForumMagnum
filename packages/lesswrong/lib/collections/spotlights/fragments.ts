import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SpotlightMinimumInfo on Spotlight {
    _id
    documentId
    documentType
    spotlightImageId
    draft
    position
    lastPromotedAt
    customTitle
    customSubtitle
    duration
  }
`)

registerFragment(`
  fragment SpotlightDisplay on Spotlight {
    ...SpotlightMinimumInfo
    document {
      _id
      title
      slug
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
