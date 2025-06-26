import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const DigestPosts: DigestPostsCollection = createCollection({
  collectionName: 'DigestPosts',
  typeName: 'DigestPost',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DigestPosts', {digestId: 1});
    return indexSet;
  },
});



export default DigestPosts;
