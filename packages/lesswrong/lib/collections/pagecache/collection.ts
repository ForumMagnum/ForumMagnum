import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const PageCache: PageCacheCollection = createCollection({
  collectionName: 'PageCache',
  typeName: 'PageCacheEntry',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
  schema,
  logChanges: true,
});

addUniversalFields({collection: PageCache})

export default PageCache;
