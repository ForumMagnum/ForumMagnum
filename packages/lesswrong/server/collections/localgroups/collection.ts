import schema from '@/lib/collections/localgroups/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const Localgroups = createCollection({
  collectionName: 'Localgroups',
  typeName: 'Localgroup',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Localgroups', { organizerIds: 1, deleted: 1, name: 1 });
    indexSet.addIndex('Localgroups', { organizerIds: 1, inactive: 1, deleted: 1, name: 1 });
    indexSet.addIndex('Localgroups', { organizerIds: 1, inactive: 1, deleted: 1 });
    indexSet.addIndex('Localgroups', { inactive: 1, deleted: 1, name: 1 });
    indexSet.addIndex('Localgroups', { mongoLocation: "2dsphere", isOnline: 1, inactive: 1, deleted: 1 });
    indexSet.addIndex('Localgroups', { isOnline: 1, inactive: 1, deleted: 1, name: 1 });
    return indexSet;
  },
});


export default Localgroups;
