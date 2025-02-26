import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
