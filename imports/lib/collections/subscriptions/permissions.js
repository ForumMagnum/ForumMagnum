import Users from 'meteor/vulcan:users';

const membersActions = [
  "subscriptions.new"
];

Users.groups.members.can(membersActions);
