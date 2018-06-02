import Users from 'meteor/vulcan:users';

const membersActions = [
  'reports.new',
  'reports.view.own',
];
Users.groups.members.can(membersActions);

const sunshineRegimentActions = [
  'reports.new',
  'reports.edit.all',
  'reports.remove.all',
  'reports.view.all',
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);
