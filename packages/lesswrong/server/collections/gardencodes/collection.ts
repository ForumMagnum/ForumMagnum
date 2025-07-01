import { createCollection } from '@/lib/vulcan-lib/collections';
import '@/lib/collections/gardencodes/fragments';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const GardenCodes = createCollection({
  collectionName: 'GardenCodes',
  typeName: 'GardenCode',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('GardenCodes', {code: 1, deleted: 1});
    indexSet.addIndex('GardenCodes', {userId: 1, deleted: 1});
    indexSet.addIndex('GardenCodes', {code: 1, deleted: 1, userId: 1, });
    return indexSet;
  },
});


export default GardenCodes;
