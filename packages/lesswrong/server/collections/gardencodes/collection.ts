import { createCollection } from '@/lib/vulcan-lib/collections';
import '@/lib/collections/gardencodes/fragments';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import schema from '@/lib/collections/gardencodes/schema';

export const GardenCodes: GardenCodesCollection = createCollection({
  collectionName: 'GardenCodes',
  typeName: 'GardenCode',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('GardenCodes', {code: 1, deleted: 1});
    indexSet.addIndex('GardenCodes', {userId: 1, deleted: 1});
    indexSet.addIndex('GardenCodes', {code: 1, deleted: 1, userId: 1, });
    return indexSet;
  },
  resolvers: getDefaultResolvers('GardenCodes'),
  mutations: getDefaultMutations('GardenCodes'), //, options),
  logChanges: true,
});


export default GardenCodes;
