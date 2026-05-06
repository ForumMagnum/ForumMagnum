import schema from '@/lib/collections/researchSandboxSessions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ResearchSandboxSessions: ResearchSandboxSessionsCollection = createCollection({
  collectionName: 'ResearchSandboxSessions',
  typeName: 'ResearchSandboxSession',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ResearchSandboxSessions', { userId: 1, projectId: 1, status: 1 });
    return indexSet;
  },
});


export default ResearchSandboxSessions;
