import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!document || !user) return false;
    return Users.canDo(user, 'rssfeeds.new.all')
  },

  editCheck: (user, document) => {
    if (!document || !user) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'rssfeeds.edit.own')
      : Users.canDo(user, 'rssfeeds.edit.all')
  },

  removeCheck: (user, document) => {
    if (!document || !user) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'rssfeeds.remove.own')
      : Users.canDo(user, 'rssfeeds.edit.all')
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
