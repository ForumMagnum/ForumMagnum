import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, ensureIndex } from '../../collectionUtils'


export const DatabaseMetadata: DatabaseMetadataCollection = createCollection({
  collectionName: "DatabaseMetadata",
  typeName: "DatabaseMetadata",
  schema
});
addUniversalFields({collection: DatabaseMetadata});

ensureIndex(DatabaseMetadata, { name:1 });
