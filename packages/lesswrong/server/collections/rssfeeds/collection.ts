import schema from '@/lib/collections/rssfeeds/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const RSSFeeds = createCollection({
  collectionName: 'RSSFeeds',
  typeName: 'RSSFeed',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('RSSFeeds', { userId: 1, createdAt: 1 });
    return indexSet;
  },
});


export default RSSFeeds;
