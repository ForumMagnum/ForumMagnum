import { guestsGroup, membersGroup } from '../../vulcan-users/permissions';

const guestsActions = [
  'gardencodes.view'
]

guestsGroup.can(guestsActions)

const memberActions = [
  'gardencodes.new',
  'gardencodes.create',
  'gardencodes.view',
  'gardencode.update.own'
]

membersGroup.can(memberActions)


