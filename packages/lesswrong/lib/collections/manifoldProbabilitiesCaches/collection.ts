import schema from './schema';
import { createCollection } from "../../vulcan-lib/collections";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ManifoldProbabilitiesCaches = createCollection({
  collectionName: 'ManifoldProbabilitiesCaches',
  typeName: 'ManifoldProbabilitiesCache',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ManifoldProbabilitiesCaches', {marketId: 1}, {unique: true});
    return indexSet;
  },
  logChanges: false,
  writeAheadLogged: false,
});

export default ManifoldProbabilitiesCaches;
