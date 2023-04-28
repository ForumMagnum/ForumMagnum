import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { ensureIndex } from '../../collectionIndexUtils';
import { forumTypeSetting } from '../../instanceSettings';

export const CronHistories: CronHistoriesCollection = createCollection({
  collectionName: 'CronHistories',
  dbCollectionName: 'cronHistory',
  typeName: 'CronHistory',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'switching',
  schema,
  logChanges: false,
});

ensureIndex(CronHistories, {intendedAt: 1, name: 1}, {unique: true});

export default CronHistories;
