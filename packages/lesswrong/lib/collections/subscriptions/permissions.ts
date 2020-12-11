import { membersGroup } from '../../vulcan-users/permissions';

const membersActions = [
  "subscriptions.new"
];

membersGroup.can(membersActions);
