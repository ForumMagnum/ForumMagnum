import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { ensureIndex } from '../../collectionIndexUtils';
import { forumTypeSetting } from '../../instanceSettings';

export const CronHistory: cronHistoryCollection = createCollection({
  collectionName: 'cronHistory', // This starts with lowercase for legacy reasons
  typeName: 'CronHistory',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'switching' : 'mongo',
  schema,
  logChanges: false,
});

ensureIndex(CronHistory, {intendedAt: 1, name: 1}, {unique: true});

export default CronHistory;
