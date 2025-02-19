import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';

export const UserEAGDetails: UserEAGDetailsCollection = createCollection({
  collectionName: 'UserEAGDetails',
  typeName: 'UserEAGDetail',
  schema,
  resolvers: getDefaultResolvers('UserEAGDetails'),
  mutations: getDefaultMutations('UserEAGDetails'),
  logChanges: true,
});

addUniversalFields({collection: UserEAGDetails})

export default UserEAGDetails;
