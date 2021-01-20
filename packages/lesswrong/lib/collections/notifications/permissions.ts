import { membersGroup, adminsGroup, userOwns, userCanDo } from '../../vulcan-users/permissions';
import Notifications from './collection';

const membersActions = [
  'notifications.new.own',
  'notifications.edit.own',
  'notifications.view.own',
];
membersGroup.can(membersActions);

const adminActions = [
  'notifications.new.all',
  'notifications.edit.all',
  'notifications.remove.all',
];
adminsGroup.can(adminActions);

Notifications.checkAccess = async (user: DbUser|null, document: DbNotification, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return userOwns(user, document) ? userCanDo(user, 'notifications.view.own') : userCanDo(user, `conversations.view.all`)
};
