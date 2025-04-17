import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const CronHistories: CronHistoriesCollection = createCollection({
  collectionName: 'CronHistories',
  dbCollectionName: 'cronHistory',
  typeName: 'CronHistory',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CronHistories', {startedAt: 1});
    indexSet.addIndex('CronHistories', {intendedAt: 1, name: 1}, {unique: true});
    return indexSet;
  },
});

export default CronHistories;
