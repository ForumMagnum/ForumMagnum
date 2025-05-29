import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const LegacyData: LegacyDataCollection = createCollection({
  collectionName: "LegacyData",
  typeName: "LegacyData",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LegacyData', {objectId: 1});
    return indexSet;
  },
});


export default LegacyData;
