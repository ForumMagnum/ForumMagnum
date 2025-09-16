import schema from '@/lib/collections/spotlights/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Spotlights = createCollection({
  collectionName: 'Spotlights',
  typeName: 'Spotlight',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Spotlights', { lastPromotedAt: -1 });
    indexSet.addIndex('Spotlights', { position: -1 });
    indexSet.addCustomPgIndex(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Spotlights_documentId_createdAt"
      ON "Spotlights" USING btree
      ("documentId", "createdAt")
      WHERE "draft" IS false
      AND "deletedDraft" IS false
    `)
    return indexSet;
  },
});


export default Spotlights;
