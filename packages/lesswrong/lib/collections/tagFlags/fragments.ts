import { gql } from "@/lib/generated/gql-codegen";

export const TagFlagFragment = gql(`
  fragment TagFlagFragment on TagFlag {
    _id
    createdAt
    name
    slug
    order
    deleted
    contents { 
      html
      htmlHighlight
      plaintextDescription
    }
  }
`)

export const TagFlagEditFragment = gql(`
  fragment TagFlagEditFragment on TagFlag {
    ...TagFlagFragment
    contents {
      ...RevisionEdit
    }
  }
`)
