import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Sessions: SessionsCollection = createCollection({
  collectionName: 'Sessions',
  dbCollectionName: 'sessions',
  typeName: 'Session',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Sessions', {_id: 1, expires: 1});
    indexSet.addIndex('Sessions', {expires: 1});
    return indexSet;
  },
  logChanges: false,
});

export default Sessions;
