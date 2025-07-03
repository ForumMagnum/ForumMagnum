import schema from '@/lib/collections/conversations/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Conversations = createCollection({
  collectionName: 'Conversations',
  typeName: 'Conversation',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Conversations', { moderator: 1, messageCount: 1, latestActivity: -1, participantIds: 1 })
    indexSet.addIndex('Conversations', { participantIds: 1, messageCount: 1, latestActivity: -1 })
    indexSet.addIndex('Conversations', { participantIds: 1, title: 1 })
    return indexSet;
  },
});

export default Conversations;
