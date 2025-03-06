import schema from '@/lib/collections/digestPosts/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const DigestPosts: DigestPostsCollection = createCollection({
  collectionName: 'DigestPosts',
  typeName: 'DigestPost',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DigestPosts', {digestId: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers('DigestPosts'),
  mutations: getDefaultMutations('DigestPosts'),
  logChanges: true,
});

addUniversalFields({collection: DigestPosts})


export default DigestPosts;
