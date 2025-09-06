import schema from '@/lib/collections/userMostValuablePosts/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserMostValuablePosts = createCollection({
  collectionName: 'UserMostValuablePosts',
  typeName: 'UserMostValuablePost',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserMostValuablePosts', { userId: 1 });
    indexSet.addIndex('UserMostValuablePosts', { userId: 1, postId: 1 });
    return indexSet;
  },
});


export default UserMostValuablePosts;
