import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment FeaturedResourcesFragment on FeaturedResource {
    _id
    title
    body
    ctaText
    ctaUrl
    expiresAt
  }
`);
