import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils'

export const DatabaseMetadata: DatabaseMetadataCollection = createCollection({
  collectionName: "DatabaseMetadata",
  typeName: "DatabaseMetadata",
  collectionType: 'pg',
  schema,
});
addUniversalFields({collection: DatabaseMetadata});

ensureIndex(DatabaseMetadata, { name: 1 }, { unique: true });
