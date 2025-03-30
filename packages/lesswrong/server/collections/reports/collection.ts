import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Reports: ReportsCollection = createCollection({
  collectionName: 'Reports',
  typeName: 'Report',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Reports', {createdAt: 1});
    indexSet.addIndex('Reports', {claimedUserId:1, createdAt: 1});
    indexSet.addIndex('Reports', {closedAt:1, createdAt: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers('Reports'),
  logChanges: true,
});

export default Reports;
