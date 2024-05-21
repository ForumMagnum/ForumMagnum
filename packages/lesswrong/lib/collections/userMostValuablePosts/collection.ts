import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';

export const UserMostValuablePosts: UserMostValuablePostsCollection = createCollection({
  collectionName: 'UserMostValuablePosts',
  typeName: 'UserMostValuablePost',
  schema,
  resolvers: getDefaultResolvers('UserMostValuablePosts'),
  mutations: getDefaultMutations('UserMostValuablePosts'),
  logChanges: true,
});

addUniversalFields({collection: UserMostValuablePosts})

export default UserMostValuablePosts;
