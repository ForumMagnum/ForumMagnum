import schema from '@/lib/collections/subscriptions/schema';
import { userCanDo } from '@/lib/vulcan-users/permissions';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
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

export default Subscriptions
