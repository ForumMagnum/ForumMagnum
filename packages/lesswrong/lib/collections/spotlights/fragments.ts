import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SpotlightDisplay on Spotlight {
    _id
    document {
      _id
      title
      slug
    }
    documentType
    description {
      html
    }
    spotlightImageId
    firstPost {
      _id
      title
      url
    }
  }
`);

registerFragment(`
  fragment SpotlightEditQueryFragment on Spotlight {
    _id
    documentId
    documentType
    description {
      ...RevisionEdit
    }
    spotlightImageId
  }
`);