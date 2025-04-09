import { gql } from "@/lib/generated/gql-codegen/gql";

export const FeaturedResourcesFragment = () => gql(`
  fragment FeaturedResourcesFragment on FeaturedResource {
    _id
    title
    body
    ctaText
    ctaUrl
    expiresAt
  }
`)
