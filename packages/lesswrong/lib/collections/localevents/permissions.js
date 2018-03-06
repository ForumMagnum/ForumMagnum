import Users from 'meteor/vulcan:users';

const membersActions = [
  'localevents.new.own',
  'localevents.edit.own',
  'localevents.remove.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'localevents.new.all',
  'localevents.edit.all',
  'localevents.remove.all',
];
Users.groups.admins.can(adminActions);
