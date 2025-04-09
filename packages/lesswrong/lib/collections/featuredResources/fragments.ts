import { frag } from "@/lib/fragments/fragmentWrapper";

export const FeaturedResourcesFragment = () => gql`
  fragment FeaturedResourcesFragment on FeaturedResource {
    _id
    title
    body
    ctaText
    ctaUrl
    expiresAt
  }
`
