import { membersGroup, adminsGroup } from '../../vulcan-users/permissions';

const membersActions = [
  'rssfeeds.new.own',
  'rssfeeds.edit.own',
  'rssfeeds.remove.own',
];
membersGroup.can(membersActions);

const adminActions = [
  'rssfeeds.new.all',
  'rssfeeds.edit.all',
  'rssfeeds.remove.all',
];
adminsGroup.can(adminActions);
