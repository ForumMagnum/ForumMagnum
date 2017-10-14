import Users from 'meteor/vulcan:users';
import Bans from './collection.js';

const membersActions = [
  'bans.view',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'bans.new',
  'bans.edit.all',
  'bans.remove.all',
  'bans.view.all',
  'bans.remove',
  'bans.edit',
];
Users.groups.admins.can(adminActions);

Bans.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return Users.canDo(user, 'bans.view')
};
