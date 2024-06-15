import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { ensureIndex } from '../../collectionIndexUtils';
import Digests from '../digests/collection';

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

DigestPosts.checkAccess = async (user: DbUser|null, document: DbDigestPost, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false
  if (user.isAdmin) return true

  // Currently, digests become "public" once they have a published date.
  return !!(await Digests.findOne({_id: document.digestId}))?.publishedDate
};

export default DigestPosts;
