import Users from '../users/collection';
import Notifications from './collection';

const membersActions = [
  'notifications.new.own',
  'notifications.edit.own',
  'notifications.view.own',
];
Users.groups.members.can(membersActions);

const adminActions = [
  'notifications.new.all',
  'notifications.edit.all',
  'notifications.remove.all',
];
Users.groups.admins.can(adminActions);

Notifications.checkAccess = async (user: DbUser|null, document: DbNotification, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return Users.owns(user, document) ? Users.canDo(user, 'notifications.view.own') : Users.canDo(user, `conversations.view.all`)
};
