import { frag } from "@/lib/fragments/fragmentWrapper"

export const TagFlagFragment = () => frag`
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
`

export const TagFlagEditFragment = () => frag`
  fragment TagFlagEditFragment on TagFlag {
    ...TagFlagFragment
    contents {
      ...RevisionEdit
    }
  }
`
