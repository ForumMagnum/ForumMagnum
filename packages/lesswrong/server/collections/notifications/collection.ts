import schema from '@/lib/collections/notifications/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

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
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Notifications', {userId:1, emailed:1, waitingForBatch:1, createdAt:-1, type:1});
    indexSet.addIndex('Notifications', {userId:1, type:1, createdAt:-1});

    // Index used in callbacks for finding notifications related to a document
    // that is being deleted
    indexSet.addIndex('Notifications', {documentId:1});

    // Used by server-sent events
    indexSet.addIndex('Notifications', {createdAt:1});

    return indexSet;
  },
  resolvers: getDefaultResolvers('Notifications'),
  mutations: getDefaultMutations('Notifications', options),
  logChanges: false,
});

Notifications.checkAccess = async (user: DbUser|null, document: DbNotification, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return userOwns(user, document) ? userCanDo(user, 'notifications.view.own') : userCanDo(user, `conversations.view.all`)
};

export default Notifications;
