import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { forumTypeSetting } from '../../instanceSettings';

export const UserMostValuablePosts: UserMostValuablePostsCollection = createCollection({
  collectionName: 'UserMostValuablePosts',
  typeName: 'UserMostValuablePost',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'switching',
  schema,
  resolvers: getDefaultResolvers('UserMostValuablePosts'),
  mutations: getDefaultMutations('UserMostValuablePosts'),
  logChanges: true,
});

addUniversalFields({collection: UserMostValuablePosts})

export default UserMostValuablePosts;
