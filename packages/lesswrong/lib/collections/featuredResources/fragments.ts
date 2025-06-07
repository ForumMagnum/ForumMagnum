import { gql } from "@/lib/crud/wrapGql";

export const FeaturedResourcesFragment = gql(`
  fragment FeaturedResourcesFragment on FeaturedResource {
    _id
    title
    body
    ctaText
    ctaUrl
    expiresAt
  }
`)
