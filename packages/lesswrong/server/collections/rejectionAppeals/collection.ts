import schema from '@/lib/collections/rejectionAppeals/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const RejectionAppeals: RejectionAppealsCollection = createCollection({
  collectionName: 'RejectionAppeals',
  typeName: 'RejectionAppeal',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('RejectionAppeals', { postId: 1 }, { unique: true, partialFilterExpression: { postId: { $ne: null } } });
    indexSet.addIndex('RejectionAppeals', { commentId: 1 }, { unique: true, partialFilterExpression: { commentId: { $ne: null } } });
    indexSet.addIndex('RejectionAppeals', { userId: 1, createdAt: -1 });
    indexSet.addIndex('RejectionAppeals', { resolvedAt: 1, createdAt: 1 });
    return indexSet;
  },
});

export default RejectionAppeals;
