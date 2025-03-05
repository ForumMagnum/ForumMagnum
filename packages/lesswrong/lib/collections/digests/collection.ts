import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Digests: DigestsCollection = createCollection({
  collectionName: 'Digests',
  typeName: 'Digest',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Digests', { num: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('Digests'),
  mutations: getDefaultMutations('Digests'),
  logChanges: true,
});

export default Digests;
