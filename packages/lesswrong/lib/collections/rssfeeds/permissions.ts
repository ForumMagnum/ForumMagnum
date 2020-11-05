import { userGroups } from '../../vulcan-users/permissions';

const membersActions = [
  'rssfeeds.new.own',
  'rssfeeds.edit.own',
  'rssfeeds.remove.own',
];
userGroups.members.can(membersActions);

const adminActions = [
  'rssfeeds.new.all',
  'rssfeeds.edit.all',
  'rssfeeds.remove.all',
];
userGroups.admins.can(adminActions);
