import { userGroups } from '../../vulcan-users/permissions';

const adminActions = [
  'book.new',
  'book.edit',
  'book.remove'
];

userGroups.admins.can(adminActions);

const memberActions = [
  'book.edit.own',
];

userGroups.members.can(memberActions);
