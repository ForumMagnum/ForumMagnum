import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Bans: BansCollection = createCollection({
  collectionName: 'Bans',
  typeName: 'Ban',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Bans', { ip: 1 })
    return indexSet;
  },
  logChanges: true,
});

export default Bans
