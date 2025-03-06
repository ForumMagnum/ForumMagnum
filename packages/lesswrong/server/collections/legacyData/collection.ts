import { createCollection } from '@/lib/vulcan-lib/collections';
import { addUniversalFields } from '@/lib/collectionUtils';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import schema from '@/lib/collections/legacyData/schema';

export const LegacyData: LegacyDataCollection = createCollection({
  collectionName: "LegacyData",
  typeName: "LegacyData",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LegacyData', {objectId: 1});
    return indexSet;
  },
});

addUniversalFields({collection: LegacyData});

export default LegacyData;
