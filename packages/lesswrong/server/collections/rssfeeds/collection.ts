import schema from '@/lib/collections/rssfeeds/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const options: MutationOptions<DbRSSFeed> = {
  newCheck: (user: DbUser|null, document: DbRSSFeed|null) => {
    if (!document || !user) return false;
    return userCanDo(user, 'rssfeeds.new.all')
  },

  editCheck: (user: DbUser|null, document: DbRSSFeed|null) => {
    if (!document || !user) return false;
    return userOwns(user, document) ? userCanDo(user, 'rssfeeds.edit.own')
      : userCanDo(user, 'rssfeeds.edit.all')
  },

  removeCheck: (user: DbUser|null, document: DbRSSFeed|null) => {
    if (!document || !user) return false;
    return userOwns(user, document) ? userCanDo(user, 'rssfeeds.remove.own')
      : userCanDo(user, 'rssfeeds.edit.all')
  }
}

export const RSSFeeds: RSSFeedsCollection = createCollection({
  collectionName: 'RSSFeeds',
  typeName: 'RSSFeed',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('RSSFeeds', { userId: 1, createdAt: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('RSSFeeds'),
  mutations: getDefaultMutations('RSSFeeds', options),
  logChanges: true,
});


export default RSSFeeds;
