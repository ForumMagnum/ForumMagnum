import { membersGroup, adminsGroup } from '../../vulcan-users/permissions';

const membersActions = [
  'localgroups.new.own',
  'localgroups.edit.own',
  'localgroups.remove.own',
];
membersGroup.can(membersActions);

const adminActions = [
  'localgroups.new.all',
  'localgroups.edit.all',
  'localgroups.remove.all',
];
adminsGroup.can(adminActions);
