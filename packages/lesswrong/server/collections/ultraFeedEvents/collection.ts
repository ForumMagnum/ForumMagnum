import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UltraFeedEvents: UltraFeedEventsCollection = createCollection({
  collectionName: 'UltraFeedEvents',
  typeName: 'UltraFeedEvent',
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UltraFeedEvents', {documentId: 1, userId: 1, eventType: 1, createdAt: 1}, {name: "ultraFeedEvents_document_user_event_createdAt"});
    
    indexSet.addIndex('UltraFeedEvents', {userId: 1, collectionName: 1, eventType: 1, createdAt: 1}, 
      {name: "ultraFeedEvents_userId_collectionName_eventType_createdAt_idx"});
    
    indexSet.addIndex('UltraFeedEvents', {userId: 1, collectionName: 1, documentId: 1}, 
      {name: "ultraFeedEvents_userId_collectionName_documentId_idx"});

    indexSet.addCustomPgIndex(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS ultraFeedEvents_sessionId_partial_idx
      ON "UltraFeedEvents" ("userId", "collectionName", "eventType", ((event->>'sessionId'))) INCLUDE ("documentId")
      WHERE "collectionName" = 'Comments' AND "eventType" = 'served';
    `);
    
    return indexSet;
  },
});

export default UltraFeedEvents;
