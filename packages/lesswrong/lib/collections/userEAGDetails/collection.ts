import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
