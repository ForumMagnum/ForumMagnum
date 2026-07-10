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
    // Plain (non-partial) unique index: every event now carries a non-null
    // claudeMessageUuid, so the old `WHERE … IS NOT NULL` partial index is
    // replaced by a plain unique one. `persistEvent`'s `ON CONFLICT
    // ("conversationId","claudeMessageUuid")` targets this index.
    indexSet.addIndex('ResearchConversationEvents', { conversationId: 1, claudeMessageUuid: 1 }, { unique: true });
    return indexSet;
  },
});


export default ResearchConversationEvents;
