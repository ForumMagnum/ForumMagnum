import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment PetrovDayLaunch on PetrovDayLaunch {
    _id
    userId
    createdAt
    launchCode
  }
`);
