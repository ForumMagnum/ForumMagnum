import { createCollection } from '../../vulcan-lib/collections';
import './fragments';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import schema from './schema';

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

addUniversalFields({collection: GardenCodes})

export default GardenCodes;
