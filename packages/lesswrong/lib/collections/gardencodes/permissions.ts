import Users from '../users/collection';

const guestsActions = [
  'gardencodes.view'
]

Users.groups.guests.can(guestsActions)

const memberActions = [
  'gardencodes.new',
  'gardencodes.create',
  'gardencodes.view'
]

Users.groups.members.can(memberActions)


