import Users from 'meteor/vulcan:users';

const membersActions = [
  'messages.new.own',
  'messages.edit.own',
  'messages.remove.own',
  'messages.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'messages.new.all',
  'messages.edit.all',
  'messages.remove.all',
  'messages.view.all',
];
Users.groups.admins.can(adminActions);
