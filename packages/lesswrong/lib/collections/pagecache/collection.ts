import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'

export const PageCache: PageCacheCollection = createCollection({
  collectionName: 'PageCache',
  typeName: 'PageCacheEntry',
  collectionType: 'pg',
  schema,
  logChanges: true,
});

addUniversalFields({collection: PageCache})

export default PageCache;
