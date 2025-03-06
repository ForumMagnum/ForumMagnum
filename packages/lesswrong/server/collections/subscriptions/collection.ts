import schema, { subscriptionTypes } from '@/lib/collections/subscriptions/schema';
import { userCanDo, userIsAdmin, userOwns } from '@/lib/vulcan-users/permissions';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import Localgroups from '@/server/collections/localgroups/collection';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

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
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Subscriptions', {userId: 1, documentId: 1, collectionName: 1, type: 1, createdAt: 1});
    return indexSet;
  },
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
