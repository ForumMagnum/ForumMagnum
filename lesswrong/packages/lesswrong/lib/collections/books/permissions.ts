import { adminsGroup, membersGroup } from '../../vulcan-users/permissions';

const adminActions = [
  'book.new',
  'book.edit',
  'book.remove'
];

adminsGroup.can(adminActions);

const memberActions = [
  'book.edit.own',
];

membersGroup.can(memberActions);
