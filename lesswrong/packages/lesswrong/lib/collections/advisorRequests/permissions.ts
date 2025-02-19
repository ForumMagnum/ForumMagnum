import { membersGroup } from '../../vulcan-users/permissions';

const membersActions = [
  'advisorrequests.view.own',
  'advisorrequests.new',
  'advisorrequests.edit.own',
];
membersGroup.can(membersActions);
