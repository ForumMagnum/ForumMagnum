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
    indexSet.addIndex('ResearchConversationEvents', { conversationId: 1, claudeMessageUuid: 1 });
    return indexSet;
  },
});


export default ResearchConversationEvents;
