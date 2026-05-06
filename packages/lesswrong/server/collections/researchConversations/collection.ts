import schema from '@/lib/collections/researchConversations/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ResearchConversations: ResearchConversationsCollection = createCollection({
  collectionName: 'ResearchConversations',
  typeName: 'ResearchConversation',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ResearchConversations', { projectId: 1, lastActivityAt: -1 });
    indexSet.addIndex('ResearchConversations', { userId: 1, lastActivityAt: -1 });
    return indexSet;
  },
});


export default ResearchConversations;
