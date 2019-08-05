import { createCollection } from 'vulcan:core';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionUtils';

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