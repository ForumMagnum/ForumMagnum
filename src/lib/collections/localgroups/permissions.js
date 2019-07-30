import Users from 'meteor/vulcan:users';

const membersActions = [
  'localgroups.new.own',
  'localgroups.edit.own',
  'localgroups.remove.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'localgroups.new.all',
  'localgroups.edit.all',
  'localgroups.remove.all',
];
Users.groups.admins.can(adminActions);
