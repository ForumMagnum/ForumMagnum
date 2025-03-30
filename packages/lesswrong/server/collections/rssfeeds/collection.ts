import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const RSSFeeds: RSSFeedsCollection = createCollection({
  collectionName: 'RSSFeeds',
  typeName: 'RSSFeed',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('RSSFeeds', { userId: 1, createdAt: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('RSSFeeds'),
  logChanges: true,
});


export default RSSFeeds;
