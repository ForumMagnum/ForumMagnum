import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UltraFeedEvents: UltraFeedEventsCollection = createCollection({
  collectionName: 'UltraFeedEvents',
  typeName: 'UltraFeedEvent',
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UltraFeedEvents', {documentId: 1, userId: 1, eventType: 1, createdAt: 1}, {name: "ultraFeedEvents_document_user_event_createdAt"});
    return indexSet;
  },
});

export default UltraFeedEvents;
