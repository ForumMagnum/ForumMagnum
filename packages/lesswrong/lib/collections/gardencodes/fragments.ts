import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
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
`);

registerFragment(`
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
`);

