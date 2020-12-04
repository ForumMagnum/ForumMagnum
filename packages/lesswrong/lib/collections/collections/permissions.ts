import { adminsGroup, membersGroup } from '../../vulcan-users/permissions';

const adminActions = [
  'collections.new.all',
  'collections.edit.all',
  'collections.remove.all'
];

adminsGroup.can(adminActions);

const memberActions = [
  'collections.edit.own',
];

membersGroup.can(memberActions);
