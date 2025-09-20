import schema from '@/lib/collections/petrovDayActions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';



export const PetrovDayActions = createCollection({
  collectionName: 'PetrovDayActions',
  typeName: 'PetrovDayAction',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PetrovDayActions', { userId: 1, actionType: 1 });
    return indexSet;
  },
});


export default PetrovDayActions;
