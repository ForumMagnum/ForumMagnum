import schema from '@/lib/collections/curationEmails/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const CurationEmails = createCollection({
  collectionName: 'CurationEmails',
  typeName: 'CurationEmail',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CurationEmails', { userId: 1 }, { unique: true });
    return indexSet;
  },
});


export default CurationEmails;
