import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Subscriptions = createCollection({
  collectionName: 'Subscriptions',
  typeName: 'Subscription',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Subscriptions', {userId: 1, documentId: 1, collectionName: 1, type: 1, createdAt: 1});
    return indexSet;
  },
});

export default Subscriptions
