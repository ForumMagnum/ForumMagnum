import { membersGroup } from '../../vulcan-users/permissions';

const membersActions = [
  'userjobads.view.own',
  'userjobads.new',
  'userjobads.edit.own',
];
membersGroup.can(membersActions);
