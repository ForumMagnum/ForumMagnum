import { createCollection } from 'meteor/vulcan:core';
import { addUniversalFields, ensureIndex } from '../../collectionUtils'

const schema = {
  _id: {
    type: String
  },
  objectId: {
    type: String,
  },
  collectionName: {
    type: String,
  },
  legacyData: {
    type: Object,
    blackbox: true
  },
};

export const LegacyData = createCollection({
  collectionName: "LegacyData",
  typeName: "LegacyData",
  schema
});

addUniversalFields({collection: LegacyData});
ensureIndex(LegacyData, {objectId:1});

export default LegacyData;
