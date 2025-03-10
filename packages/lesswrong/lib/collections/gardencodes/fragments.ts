export const GardenCodeFragment = `
  fragment GardenCodeFragment on GardenCode {
    _id
    code
    title
    userId
    deleted
    slug
    startTime
    endTime
    fbLink
    type
    afOnly
    contents {
      ...RevisionDisplay
    }
  }
`

export const GardenCodeFragmentEdit = `
  fragment GardenCodeFragmentEdit on GardenCode {
    _id
    code
    title
    userId
    deleted
    slug
    startTime
    endTime
    fbLink
    type
    afOnly
    contents {
      ...RevisionEdit
    }
  }
`

