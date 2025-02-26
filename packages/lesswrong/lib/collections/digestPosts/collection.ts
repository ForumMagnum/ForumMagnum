import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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
