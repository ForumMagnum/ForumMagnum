import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment PetrovDayActionInfo on PetrovDayAction {
    _id
    createdAt
    userId
    actionType
    data
  }
`);
