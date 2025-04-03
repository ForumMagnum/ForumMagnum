export const TagFlagFragment = `
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

export const TagFlagEditFragment = `
  fragment TagFlagEditFragment on TagFlag {
    ...TagFlagFragment
    contents {
      ...RevisionEdit
    }
  }
`
