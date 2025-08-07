import schema from '@/lib/collections/multiDocuments/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const MultiDocuments = createCollection({
  collectionName: 'MultiDocuments',
  typeName: 'MultiDocument',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('MultiDocuments', { parentDocumentId: 1, collectionName: 1 });
    indexSet.addIndex('MultiDocuments', { slug: 1 });
    indexSet.addIndex('MultiDocuments', { oldSlugs: 1 });
    indexSet.addCustomPgIndex(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multi_documents_pingbacks ON "MultiDocuments" USING gin(pingbacks);`);
    return indexSet;
  },
  voteable: {
    timeDecayScoresCronjob: false,
  },
});
