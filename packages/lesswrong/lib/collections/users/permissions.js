import Users from 'meteor/vulcan:users'

const sunshineRegimentActions = [
  'users.edit.all',
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);
