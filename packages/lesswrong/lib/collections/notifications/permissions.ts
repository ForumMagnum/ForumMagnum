import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import Notifications from './collection';

Notifications.checkAccess = async (user: DbUser|null, document: DbNotification, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return userOwns(user, document) ? userCanDo(user, 'notifications.view.own') : userCanDo(user, `conversations.view.all`)
};
