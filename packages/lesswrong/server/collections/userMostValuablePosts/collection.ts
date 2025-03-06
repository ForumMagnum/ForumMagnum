import schema from '@/lib/collections/userMostValuablePosts/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
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

addUniversalFields({collection: UserMostValuablePosts})

export default UserMostValuablePosts;
