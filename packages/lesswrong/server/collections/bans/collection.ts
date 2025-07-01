import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Bans = createCollection({
  collectionName: 'Bans',
  typeName: 'Ban',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Bans', { ip: 1 })
    return indexSet;
  },
});

export default Bans
