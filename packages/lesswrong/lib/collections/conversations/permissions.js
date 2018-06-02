import Users from 'meteor/vulcan:users';

const membersActions = [
  'conversations.new.own',
  'conversations.edit.own',
  'conversations.remove.own',
  'conversations.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'conversations.new.all',
  'conversations.edit.all',
  'conversations.remove.all',
  'conversations.view.all',
];
Users.groups.admins.can(adminActions);
