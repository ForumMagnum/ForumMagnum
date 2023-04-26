import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils'
import { forumTypeSetting } from '../../instanceSettings';

const schema: SchemaType<DbLegacyData> = {
  objectId: {
    type: String,
  },
  collectionName: {
    type: String,
  },
};

export const LegacyData: LegacyDataCollection = createCollection({
  collectionName: "LegacyData",
  typeName: "LegacyData",
  collectionType: 'pg',
  schema
});

addUniversalFields({collection: LegacyData});
ensureIndex(LegacyData, {objectId:1});

export default LegacyData;
