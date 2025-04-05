import { frag } from "@/lib/fragments/fragmentWrapper"

export const GardenCodeFragment = () => frag`
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

export const GardenCodeFragmentEdit = () => frag`
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

