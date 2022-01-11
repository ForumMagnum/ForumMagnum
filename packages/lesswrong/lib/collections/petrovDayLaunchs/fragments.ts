import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment PetrovDayLaunch on PetrovDayLaunch {
    _id
    createdAt
    launchCode
    userId
  }
`);
