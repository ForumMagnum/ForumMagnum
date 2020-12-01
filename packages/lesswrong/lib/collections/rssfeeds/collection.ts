import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
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
});

addUniversalFields({collection: RSSFeeds})

export default RSSFeeds;
