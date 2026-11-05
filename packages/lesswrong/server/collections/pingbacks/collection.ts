import schema from '@/lib/collections/pingbacks/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Pingbacks: PingbacksCollection = createCollection({
  collectionName: 'Pingbacks',
  typeName: 'Pingback',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Pingbacks', { sourcePostId: 1, targetPostId: 1 }, { unique: true });
    indexSet.addIndex('Pingbacks', { targetPostId: 1, deleted: 1 });
    return indexSet;
  },
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export default Pingbacks;
