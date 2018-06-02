import Users from 'meteor/vulcan:users';

const membersActions = [
  'usercollectionrels.new.own',
  'usercollectionrels.edit.own',
  'usercollectionrels.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'usercollectionrels.new.all',
  'usercollectionrels.edit.all',
  'usercollectionrels.remove.all',
];
Users.groups.admins.can(adminActions);
