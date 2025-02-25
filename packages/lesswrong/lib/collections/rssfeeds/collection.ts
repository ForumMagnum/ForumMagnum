import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
  resolvers: getDefaultResolvers('RSSFeeds'),
  mutations: getDefaultMutations('RSSFeeds', options),
  logChanges: true,
});

addUniversalFields({collection: RSSFeeds})

export default RSSFeeds;
