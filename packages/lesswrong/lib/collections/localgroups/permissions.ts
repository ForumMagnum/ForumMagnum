import { userGroups } from '../../vulcan-users/permissions';

const membersActions = [
  'localgroups.new.own',
  'localgroups.edit.own',
  'localgroups.remove.own',
];
userGroups.members.can(membersActions);

const adminActions = [
  'localgroups.new.all',
  'localgroups.edit.all',
  'localgroups.remove.all',
];
userGroups.admins.can(adminActions);
