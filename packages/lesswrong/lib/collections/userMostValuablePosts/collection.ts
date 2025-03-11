import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserMostValuablePosts: UserMostValuablePostsCollection = createCollection({
  collectionName: 'UserMostValuablePosts',
  typeName: 'UserMostValuablePost',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserMostValuablePosts', { userId: 1 });
    indexSet.addIndex('UserMostValuablePosts', { userId: 1, postId: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('UserMostValuablePosts'),
  mutations: getDefaultMutations('UserMostValuablePosts'),
  logChanges: true,
});

export default UserMostValuablePosts;
