import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionIndexUtils';

// TODO remove
export const HybridViewLogs: HybridViewLogsCollection = createCollection({
  collectionName: 'HybridViewLogs',
  typeName: 'HybridViewLog',
  collectionType: 'pg',
  schema,
  logChanges: false,
});

addUniversalFields({collection: HybridViewLogs})
ensureIndex(HybridViewLogs, {identifier: 1, latest: 1})
ensureIndex(HybridViewLogs, {actionStartTime: 1})
ensureIndex(HybridViewLogs, {actionEndTime: 1})

export default HybridViewLogs;
