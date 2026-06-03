import schema from '@/lib/collections/researchDocuments/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ResearchDocuments: ResearchDocumentsCollection = createCollection({
  collectionName: 'ResearchDocuments',
  typeName: 'ResearchDocument',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ResearchDocuments', { projectId: 1, createdAt: -1 });
    indexSet.addIndex('ResearchDocuments', { userId: 1, createdAt: -1 });
    return indexSet;
  },
});


export default ResearchDocuments;
