import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment PetrovDayLaunchInfo on PetrovDayLaunch {
    _id
    createdAt
    launchCode
    userId
  }
`);
