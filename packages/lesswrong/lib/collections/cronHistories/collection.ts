import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { ensureIndex } from '../../collectionIndexUtils';

export const CronHistories: CronHistoriesCollection = createCollection({
  collectionName: 'CronHistories',
  dbCollectionName: 'cronHistory',
  typeName: 'CronHistory',
  schema,
  logChanges: false,
});

ensureIndex(CronHistories, {startedAt: 1});
ensureIndex(CronHistories, {intendedAt: 1, name: 1}, {unique: true});

export default CronHistories;
