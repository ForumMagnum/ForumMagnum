import schema from '@/lib/collections/curationEmails/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const CurationEmails: CurationEmailsCollection = createCollection({
  collectionName: 'CurationEmails',
  typeName: 'CurationEmail',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CurationEmails', { userId: 1 }, { unique: true });
    return indexSet;
  },
  logChanges: true,
});


export default CurationEmails;
