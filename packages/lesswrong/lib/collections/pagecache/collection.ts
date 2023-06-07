import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionIndexUtils';

export const PageCache: PageCacheCollection = createCollection({
  collectionName: 'PageCache',
  typeName: 'PageCacheEntry',
  collectionType: 'pg',
  schema,
  logChanges: false,
});

addUniversalFields({collection: PageCache})

ensureIndex(PageCache, {path: 1, bundleHash: 1, expiresAt: 1})
ensureIndex(PageCache, {path: 1, abTestGroups: 1, bundleHash: 1}, {unique: true})

export default PageCache;
