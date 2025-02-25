import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment PetrovDayActionInfo on PetrovDayAction {
    _id
    createdAt
    userId
    actionType
    data
  }
`);
