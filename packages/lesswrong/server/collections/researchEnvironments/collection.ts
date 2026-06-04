import schema from '@/lib/collections/researchEnvironments/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ResearchEnvironments: ResearchEnvironmentsCollection = createCollection({
  collectionName: 'ResearchEnvironments',
  typeName: 'ResearchEnvironment',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ResearchEnvironments', { projectId: 1, createdAt: -1 });
    return indexSet;
  },
});


export default ResearchEnvironments;
