import schema from '@/lib/collections/reports/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Reports = createCollection({
  collectionName: 'Reports',
  typeName: 'Report',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Reports', {createdAt: 1});
    indexSet.addIndex('Reports', {claimedUserId:1, createdAt: 1});
    indexSet.addIndex('Reports', {closedAt:1, createdAt: 1});
    return indexSet;
  },
});

export default Reports;
