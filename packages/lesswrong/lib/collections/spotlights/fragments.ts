import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SpotlightDisplay on Spotlight {
    _id
    document
    documentType
    description {
      html
    }
    spotlightImageId
  }
`);