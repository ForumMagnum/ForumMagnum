import schema from '@/lib/collections/userEAGDetails/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserEAGDetails: UserEAGDetailsCollection = createCollection({
  collectionName: 'UserEAGDetails',
  typeName: 'UserEAGDetail',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserEAGDetails', { userId: 1 }, { unique: true });
    return indexSet;
  },
  resolvers: getDefaultResolvers('UserEAGDetails'),
  mutations: getDefaultMutations('UserEAGDetails'),
  logChanges: true,
});

addUniversalFields({collection: UserEAGDetails})

export default UserEAGDetails;
