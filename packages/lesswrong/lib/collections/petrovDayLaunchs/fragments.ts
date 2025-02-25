import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment PetrovDayLaunchInfo on PetrovDayLaunch {
    _id
    createdAt
    launchCode
    userId
  }
`);
