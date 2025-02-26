import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

const options: MutationOptions<DbNotification> = {
  newCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'notifications.new.own') : userCanDo(user, `notifications.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'notifications.edit.own') : userCanDo(user, `notifications.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'notifications.remove.own') : userCanDo(user, `notifications.remove.all`)
  }
}

export const Notifications: NotificationsCollection = createCollection({
  collectionName: 'Notifications',
  typeName: 'Notification',
  schema,
  resolvers: getDefaultResolvers('Notifications'),
  mutations: getDefaultMutations('Notifications', options),
  logChanges: false,
});

addUniversalFields({
  collection: Notifications,
  createdAtOptions: {canRead: [userOwns]},
})

Notifications.checkAccess = async (user: DbUser|null, document: DbNotification, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return userOwns(user, document) ? userCanDo(user, 'notifications.view.own') : userCanDo(user, `conversations.view.all`)
};

export default Notifications;
