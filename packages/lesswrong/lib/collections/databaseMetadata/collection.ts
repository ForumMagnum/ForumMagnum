import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from '../../collectionUtils';
import { ensureCustomPgIndex } from '../../collectionIndexUtils'

export const DatabaseMetadata: DatabaseMetadataCollection = createCollection({
  collectionName: "DatabaseMetadata",
  typeName: "DatabaseMetadata",
  schema,
});
addUniversalFields({collection: DatabaseMetadata});

void ensureCustomPgIndex(`
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_DatabaseMetadata_name"
  ON public."DatabaseMetadata" USING btree
  (name)
`);
