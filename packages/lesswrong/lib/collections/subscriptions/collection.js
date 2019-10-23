import schema from './schema.js';
import Users from 'meteor/vulcan:users'
import { getDefaultResolvers, getDefaultMutations, createCollection } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'

const options = {
  create: true,
  createCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, 'subscriptions.new');
  },
  update: false,
  upsert: false, 
  delete: false
}

export const Subscriptions = createCollection({
  collectionName: 'Subscriptions',
  typeName: 'Subscription',
  schema,
  resolvers: getDefaultResolvers('Subscriptions'),
  mutations: getDefaultMutations('Subscriptions', options),
});

addUniversalFields({collection: Subscriptions})
export default Subscriptions
