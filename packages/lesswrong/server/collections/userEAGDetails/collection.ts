import schema from '@/lib/collections/userEAGDetails/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserEAGDetails = createCollection({
  collectionName: 'UserEAGDetails',
  typeName: 'UserEAGDetail',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserEAGDetails', { userId: 1 }, { unique: true });
    return indexSet;
  },
});


export default UserEAGDetails;
