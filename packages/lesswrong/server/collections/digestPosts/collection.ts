import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const DigestPosts: DigestPostsCollection = createCollection({
  collectionName: 'DigestPosts',
  typeName: 'DigestPost',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DigestPosts', {digestId: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers('DigestPosts'),
  logChanges: true,
});



export default DigestPosts;
