import { userGroups } from '../../vulcan-users/permissions';

const adminActions = [
  'collections.new.all',
  'collections.edit.all',
  'collections.remove.all'
];

userGroups.admins.can(adminActions);

const memberActions = [
  'collections.edit.own',
];

userGroups.members.can(memberActions);
