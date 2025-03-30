import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Digests: DigestsCollection = createCollection({
  collectionName: 'Digests',
  typeName: 'Digest',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Digests', { num: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('Digests'),
  logChanges: true,
});


export default Digests;
