import schema from './schema';
import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbSubscription> = {
  create: true,
  newCheck: (user: DbUser|null, document: DbSubscription|null) => {
    if (!user || !document) return false;
    return userCanDo(user, 'subscriptions.new');
  },
  update: false,
  upsert: false, 
  delete: false
}

export const Subscriptions: SubscriptionsCollection = createCollection({
  collectionName: 'Subscriptions',
  typeName: 'Subscription',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('Subscriptions'),
  mutations: getDefaultMutations('Subscriptions', options),
});

addUniversalFields({
  collection: Subscriptions,
  createdAtOptions: {canRead: [userOwns]},
});

export default Subscriptions
