import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const Unlockables: UnlockablesCollection = createCollection({
  collectionName: 'Unlockables',
  typeName: 'Unlockable',
  getIndexes: () => {
    const databaseIndexSet = new DatabaseIndexSet();
    databaseIndexSet.addIndex('Unlockables', { userId: 1 });
    return databaseIndexSet;
  },
});

export default Unlockables;
