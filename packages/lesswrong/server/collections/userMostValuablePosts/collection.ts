import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserMostValuablePosts: UserMostValuablePostsCollection = createCollection({
  collectionName: 'UserMostValuablePosts',
  typeName: 'UserMostValuablePost',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserMostValuablePosts', { userId: 1 });
    indexSet.addIndex('UserMostValuablePosts', { userId: 1, postId: 1 });
    return indexSet;
  },
});


export default UserMostValuablePosts;
