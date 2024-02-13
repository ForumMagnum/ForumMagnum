import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureCustomPgIndex, ensureIndex } from '../../collectionIndexUtils';

export const PageCache: PageCacheCollection = createCollection({
  collectionName: 'PageCache',
  typeName: 'PageCacheEntry',
  schema,
  logChanges: false,
  writeAheadLogged: false,
});

addUniversalFields({collection: PageCache})

ensureIndex(PageCache, {path: 1, bundleHash: 1, expiresAt: 1})

void ensureCustomPgIndex(`
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_PageCache_path_abTestGroups_bundleHash"
  ON public."PageCache" USING btree
  (path, "abTestGroups", "bundleHash")
`);

export default PageCache;
