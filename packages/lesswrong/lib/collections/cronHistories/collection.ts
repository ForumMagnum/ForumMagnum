import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const CronHistories: CronHistoriesCollection = createCollection({
  collectionName: 'CronHistories',
  dbCollectionName: 'cronHistory',
  typeName: 'CronHistory',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('CronHistories', {startedAt: 1});
    indexSet.addIndex('CronHistories', {intendedAt: 1, name: 1}, {unique: true});
    return indexSet;
  },
  logChanges: false,
});

export default CronHistories;
