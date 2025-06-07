import { gql } from "@/lib/crud/wrapGql";

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
