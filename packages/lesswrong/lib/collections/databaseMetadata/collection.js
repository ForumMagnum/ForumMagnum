import schema from './schema';
import { createCollection } from 'meteor/vulcan:core';
import { addUniversalFields, ensureIndex } from '../../collectionUtils'


export const DatabaseMetadata = createCollection({
  collectionName: "DatabaseMetadata",
  typeName: "DatabaseMetadata",
  schema
});
addUniversalFields({collection: DatabaseMetadata});

ensureIndex(DatabaseMetadata, { name:1 });
