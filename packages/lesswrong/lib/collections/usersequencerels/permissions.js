import Users from 'meteor/vulcan:users';

const membersActions = [
  'usersequencerels.new.own',
  'usersequencerels.edit.own',
  'usersequencerels.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'usersequencerels.new.all',
  'usersequencerels.edit.all',
  'usersequencerels.remove.all',
];
Users.groups.admins.can(adminActions);
