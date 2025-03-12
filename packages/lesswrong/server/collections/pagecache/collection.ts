import schema from '@/lib/collections/pagecache/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const PageCache: PageCacheCollection = createCollection({
  collectionName: 'PageCache',
  typeName: 'PageCacheEntry',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PageCache', { path: 1, bundleHash: 1, expiresAt: 1 });
    indexSet.addCustomPgIndex(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_PageCache_path_abTestGroups_bundleHash"
      ON public."PageCache" USING btree
      (path, "abTestGroups", "bundleHash")
    `);
    return indexSet;
  },
  logChanges: false,
  writeAheadLogged: false,
});


export default PageCache;
