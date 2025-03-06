import schema from '@/lib/collections/curationEmails/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { addUniversalFields } from '@/lib/collectionUtils'
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

addUniversalFields({ collection: CurationEmails });

export default CurationEmails;
