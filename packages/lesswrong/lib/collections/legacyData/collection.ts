import { createCollection } from '../../vulcan-lib/collections';
import { universalFields } from '../../collectionUtils';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const schema: SchemaType<"LegacyData"> = {
  ...universalFields({}),
  objectId: {
    type: String,
    nullable: false,
  },
  collectionName: {
    type: String,
    nullable: false,
  },
};

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

export default LegacyData;
