import { gql } from "@/lib/generated/gql-codegen/gql";

export const ModerationTemplateFragment = () => gql(`
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
