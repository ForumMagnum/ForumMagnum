import { frag } from "@/lib/fragments/fragmentWrapper";

export const FeaturedResourcesFragment = () => frag`
  fragment FeaturedResourcesFragment on FeaturedResource {
    _id
    title
    body
    ctaText
    ctaUrl
    expiresAt
  }
`
