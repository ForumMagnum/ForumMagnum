import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const DatabaseMetadata: DatabaseMetadataCollection = createCollection({
  collectionName: "DatabaseMetadata",
  typeName: "DatabaseMetadata",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addCustomPgIndex(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_DatabaseMetadata_name"
      ON public."DatabaseMetadata" USING btree
      (name)
    `);
    return indexSet;
  },
});

