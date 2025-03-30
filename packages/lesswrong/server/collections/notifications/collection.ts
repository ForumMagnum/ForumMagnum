import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Notifications: NotificationsCollection = createCollection({
  collectionName: 'Notifications',
  typeName: 'Notification',
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
  logChanges: false,
});

export default Notifications;
