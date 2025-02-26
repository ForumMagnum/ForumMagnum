import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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
