import { gql } from "@/lib/crud/wrapGql";

export const GardenCodeFragment = gql(`
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
`)

export const GardenCodeFragmentEdit = gql(`
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
`)

