import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment GardenCodeFragment on GardenCode {
    _id
    title
    userId
    deleted
    slug
    startTime
    endTime
  }
`);

