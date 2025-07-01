import schema from '@/lib/collections/legacyData/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const LegacyData = createCollection({
  collectionName: "LegacyData",
  typeName: "LegacyData",
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LegacyData', {objectId: 1});
    return indexSet;
  },
});


export default LegacyData;
