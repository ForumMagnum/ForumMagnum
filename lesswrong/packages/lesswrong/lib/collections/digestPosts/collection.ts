import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { ensureIndex } from '../../collectionIndexUtils';

export const DigestPosts: DigestPostsCollection = createCollection({
  collectionName: 'DigestPosts',
  typeName: 'DigestPost',
  schema,
  resolvers: getDefaultResolvers('DigestPosts'),
  mutations: getDefaultMutations('DigestPosts'),
  logChanges: true,
});

addUniversalFields({collection: DigestPosts})

ensureIndex(DigestPosts, {digestId: 1})

export default DigestPosts;
