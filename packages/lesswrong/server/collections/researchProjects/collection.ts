import schema from '@/lib/collections/researchProjects/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ResearchProjects: ResearchProjectsCollection = createCollection({
  collectionName: 'ResearchProjects',
  typeName: 'ResearchProject',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ResearchProjects', { userId: 1, createdAt: -1 });
    return indexSet;
  },
});


export default ResearchProjects;
