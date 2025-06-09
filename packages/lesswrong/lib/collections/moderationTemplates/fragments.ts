import { gql } from "@/lib/generated/gql-codegen";

export const ModerationTemplateFragment = gql(`
  fragment ModerationTemplateFragment on ModerationTemplate {
    _id
    name
    collectionName
    order
    deleted
    contents {
      ...RevisionEdit
    }
  }
`)
