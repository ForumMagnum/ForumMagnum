import { registerMigration } from './migrationUtils';
import { forEachDocumentBatchInCollection } from '../queryUtil.js';
import { LWEvents } from '../../lib/collections/lwevents'
import { ReadStatuses } from '../../lib/collections/readStatus/collection.js'

registerMigration({
  name: "denormalizeReadStatus",
  idempotent: true,
  action: async () => {
    forEachDocumentBatchInCollection({
      collection: LWEvents,
      batchSize: 10000,
      filter: {name: "post-view"},
      callback: (postViews) => {
        const updates = postViews.map(view => ({
          updateOne: {
            filter: {
              postId: view.docmentId,
              userId: view.userId,
            },
            update: {
              $max: {
                lastUpdated: view.createdAt,
              },
              $set: {
                isRead: true
              },
            },
            upsert: true,
          }
        }));
        ReadStatuses.rawCollection().bulkWrite(updates);
      }
    })
  }
});