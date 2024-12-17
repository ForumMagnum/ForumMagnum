import schema, { subscriptionTypes } from './schema';
import { userCanDo, userIsAdmin, userOwns } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import Localgroups from '../localgroups/collection';

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
  schema,
  resolvers: getDefaultResolvers('Subscriptions'),
  mutations: getDefaultMutations('Subscriptions', options),
});

Subscriptions.checkAccess = async (currentUser: DbUser|null, subscription: DbSubscription, context: ResolverContext|null): Promise<boolean> => {
  if (!currentUser) return false;
  if (subscription.userId === currentUser._id) return true;
  if (userIsAdmin(currentUser)) return true;
  
  // If this subscription is to a LocalGroup, organizers of that group can see
  // the subscription
  if (subscription.type === subscriptionTypes.newEvents && subscription.documentId) {
    const localGroup = context
      ? await context.loaders.Localgroups.load(subscription.documentId)
      : await Localgroups.findOne({_id: subscription.documentId});
    if (localGroup) {
      if (localGroup.organizerIds.includes(currentUser._id))
        return true;
    }
  }
  
  return false;
}

addUniversalFields({
  collection: Subscriptions,
});

export default Subscriptions
