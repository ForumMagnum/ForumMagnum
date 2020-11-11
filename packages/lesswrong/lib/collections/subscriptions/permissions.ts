import { userGroups } from '../../vulcan-users/permissions';

const membersActions = [
  "subscriptions.new"
];

userGroups.members.can(membersActions);
