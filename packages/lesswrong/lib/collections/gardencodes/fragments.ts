import { registerFragment } from '../../vulcan-lib';

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
  }
`);

