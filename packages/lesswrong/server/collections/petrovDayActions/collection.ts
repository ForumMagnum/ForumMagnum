import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';



export const PetrovDayActions: PetrovDayActionsCollection = createCollection({
  collectionName: 'PetrovDayActions',
  typeName: 'PetrovDayAction',
  resolvers: getDefaultResolvers('PetrovDayActions'),
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PetrovDayActions', { userId: 1, actionType: 1 });
    return indexSet;
  },
});


export default PetrovDayActions;
