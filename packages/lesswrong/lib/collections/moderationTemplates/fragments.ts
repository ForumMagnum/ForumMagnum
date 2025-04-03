export const ModerationTemplateFragment = `
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
