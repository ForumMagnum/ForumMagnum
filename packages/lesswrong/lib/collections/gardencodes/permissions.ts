import { guestsGroup, membersGroup } from '../../vulcan-users/permissions';

const guestsActions = [
  'gardencodes.view'
]

guestsGroup.can(guestsActions)

const memberActions = [
  'gardencodes.new',
  'gardencodes.create',
  'gardencodes.view'
]

membersGroup.can(memberActions)


