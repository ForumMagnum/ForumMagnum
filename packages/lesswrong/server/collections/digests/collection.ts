import schema from '@/lib/collections/digests/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Digests = createCollection({
  collectionName: 'Digests',
  typeName: 'Digest',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Digests', { num: 1 });
    return indexSet;
  },
});


export default Digests;
