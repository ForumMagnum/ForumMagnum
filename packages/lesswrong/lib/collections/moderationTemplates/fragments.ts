import { frag } from "@/lib/fragments/fragmentWrapper";

export const ModerationTemplateFragment = () => frag`
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
`
