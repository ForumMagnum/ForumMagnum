import Users from '../users/collection';

const membersActions = [
  "subscriptions.new"
];

Users.groups.members.can(membersActions);
