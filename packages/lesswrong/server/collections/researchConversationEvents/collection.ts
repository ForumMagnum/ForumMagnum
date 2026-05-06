import schema from '@/lib/collections/researchConversationEvents/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ResearchConversationEvents: ResearchConversationEventsCollection = createCollection({
  collectionName: 'ResearchConversationEvents',
  typeName: 'ResearchConversationEvent',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ResearchConversationEvents', { conversationId: 1, seq: 1 }, { unique: true });
    indexSet.addCustomPgIndex(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_ResearchConversationEvents_conversationId_claudeMessageUuid"
      ON "ResearchConversationEvents" ("conversationId", "claudeMessageUuid")
      WHERE "claudeMessageUuid" IS NOT NULL;
    `);
    return indexSet;
  },
});


export default ResearchConversationEvents;
