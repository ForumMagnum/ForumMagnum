import schema from '@/lib/collections/researchSandboxSessions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ResearchSandboxSessions: ResearchSandboxSessionsCollection = createCollection({
  collectionName: 'ResearchSandboxSessions',
  typeName: 'ResearchSandboxSession',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // One sandbox per conversation — unique so getOrCreateSandbox can rely on
    // findOne({ conversationId }) and the row's existence as the "provisioned"
    // signal.
    indexSet.addIndex('ResearchSandboxSessions', { conversationId: 1 }, { unique: true });
    return indexSet;
  },
});


export default ResearchSandboxSessions;
