import schema from '@/lib/collections/ultraFeedEvents/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UltraFeedEvents = createCollection({
  collectionName: 'UltraFeedEvents',
  typeName: 'UltraFeedEvent',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UltraFeedEvents', {documentId: 1, userId: 1, eventType: 1, createdAt: 1}, {name: "ultraFeedEvents_document_user_event_createdAt"});
    
    indexSet.addIndex('UltraFeedEvents', {userId: 1, collectionName: 1, eventType: 1, createdAt: 1}, 
      {name: "ultraFeedEvents_userId_collectionName_eventType_createdAt_idx"});
    
    indexSet.addIndex('UltraFeedEvents', {userId: 1, collectionName: 1, documentId: 1}, 
      {name: "ultraFeedEvents_userId_collectionName_documentId_idx"});
    
    return indexSet;
  },
});

export default UltraFeedEvents;
