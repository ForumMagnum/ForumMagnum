import { userGroups } from '../../vulcan-users/permissions';

const guestsActions = [
  'gardencodes.view'
]

userGroups.guests.can(guestsActions)

const memberActions = [
  'gardencodes.new',
  'gardencodes.create',
  'gardencodes.view'
]

userGroups.members.can(memberActions)


