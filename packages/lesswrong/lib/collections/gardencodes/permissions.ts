import { userGroups } from '../../vulcan-users/permissions';

const guestsActions = [
  'gardencodes.view'
]

userGroups.guests.can(guestsActions)

const memberActions = [
  'gardencodes.new',
  'gardencodes.create',
  'gardencodes.view',
  'gardencodes.update.own'
]

userGroups.members.can(memberActions)


