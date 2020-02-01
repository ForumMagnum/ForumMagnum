import Users from '../users/collection';

const adminActions = [
  'book.new',
  'book.edit',
  'book.remove'
];

Users.groups.admins.can(adminActions);

const memberActions = [
  'book.edit.own',
];

Users.groups.members.can(memberActions);
